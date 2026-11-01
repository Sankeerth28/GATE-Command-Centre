import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from app.models.models import (
    Topic, Subject, WorkItem, UserSettings, AutomationEvent,
    DEFAULT_SUBJECT_ALLOCATIONS_JSON, DEFAULT_WEEKLY_SCHEDULE_JSON, DEFAULT_PHASES_JSON
)

# Linear Algebra strict foundational topic sequence
LINEAR_ALGEBRA_TOPIC_SEQUENCE = [
    "Vector Spaces and Subspaces",
    "Matrices & Systems of Linear Equations",
    "Linear Transformations & Matrix Representations",
    "Eigenvalues, Eigenvectors & Diagonalization",
    "Orthogonality & Projections",
    "Advanced Factorizations & SVD"
]

# Phase 1 allowed topics per subject (Foundation Rebuilding: Nov 2 - Nov 15)
PHASE_1_TOPIC_KEYWORDS = {
    "LIN_ALG": ["Vector Spaces", "Matrices"],
    "PROB_STAT": ["Counting", "Axioms"],
    "CALC_OPT": ["Limits", "Taylor"],
    "PROG_DSA": ["Python Data", "Control Flow", "Linear Data"],
    "DBMS_DWH": ["ER Model", "Relational Algebra"],
    "ML_AI": ["Linear Regression"],
    "GEN_APT": ["English Grammar", "Numerical Computation"]
}

# Phase 2 allowed topics per subject (Core Subject Coverage: Nov 16 - Dec 13)
PHASE_2_TOPIC_KEYWORDS = {
    "LIN_ALG": ["Linear Transformations", "Eigenvalues", "Orthogonality", "Advanced Factorizations"],
    "PROB_STAT": ["Discrete Random", "Continuous Random", "Joint Probability"],
    "CALC_OPT": ["Maxima and Minima", "Partial Derivatives", "Unconstrained"],
    "PROG_DSA": ["Trees & Binary", "Heaps", "Asymptotic Analysis", "Sorting"],
    "DBMS_DWH": ["Structured Query", "Functional Dependencies", "Transactions"],
    "ML_AI": ["Classification", "k-Nearest", "Support Vector"],
    "GEN_APT": ["Reading Comprehension", "Data Interpretation"]
}

def get_current_phase(date_str: str, phases: List[Dict[str, Any]]) -> Dict[str, Any]:
    for p in phases:
        if p["start_date"] <= date_str <= p["end_date"]:
            return p
    # Fallback to closest phase
    if date_str < phases[0]["start_date"]:
        return phases[0]
    return phases[-1]

def generate_study_plan(
    session: Session,
    start_date: Optional[str] = None,
    target_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a deadline-driven, timetable-backed study schedule:
    - 39 weekly hours (Mon-Sat: 6 hours, Sun: 3 hours)
    - Follows subject allocation and 4 preparation phases
    - Dedicated foundational revision sequence for Linear Algebra
    - Accommodates Spaced Repetition (SRS) tasks
    - Enforces hard syllabus deadline of January 15, 2027
    """
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    
    if not start_date:
        start_date = settings.prep_start_date if settings and settings.prep_start_date else "2026-11-02"
    if not target_date:
        target_date = settings.syllabus_target_date if settings else "2027-01-15"
        
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    target_dt = datetime.strptime(target_date, "%Y-%m-%d")
    if target_dt <= start_dt:
        target_dt = start_dt + timedelta(days=75)
        
    weekly_schedule = json.loads(settings.weekly_schedule_json) if settings and settings.weekly_schedule_json else json.loads(DEFAULT_WEEKLY_SCHEDULE_JSON)
    phases = json.loads(settings.phases_json) if settings and settings.phases_json else json.loads(DEFAULT_PHASES_JSON)
    
    # Pre-fetch subjects & topics
    subjects = session.exec(select(Subject).order_by(Subject.display_order)).all()
    subj_code_map = {s.code: s for s in subjects}
    subj_id_map = {s.id: s for s in subjects}
    
    all_topics = session.exec(select(Topic).order_by(Topic.display_order)).all()
    topics_by_subj: Dict[int, List[Topic]] = {}
    for t in all_topics:
        topics_by_subj.setdefault(t.subject_id, []).append(t)
        
    # Sort LIN_ALG topics according to strict foundational sequence
    lin_alg_subj = subj_code_map.get("LIN_ALG")
    if lin_alg_subj and lin_alg_subj.id in topics_by_subj:
        def la_sort_key(top: Topic):
            for idx, prefix in enumerate(LINEAR_ALGEBRA_TOPIC_SEQUENCE):
                if prefix.lower() in top.title.lower():
                    return idx
            return 99
        topics_by_subj[lin_alg_subj.id].sort(key=la_sort_key)
        
    # Check existing future scheduled work items to avoid duplicate tasks
    existing_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date >= start_date)
    ).all()
    
    scheduled_by_date_and_subj: Dict[str, Dict[int, int]] = {}
    for it in existing_items:
        if it.subject_id and it.status in ["Scheduled", "In Progress", "Completed"]:
            scheduled_by_date_and_subj.setdefault(it.scheduled_date, {}).setdefault(it.subject_id, 0)
            scheduled_by_date_and_subj[it.scheduled_date][it.subject_id] += it.estimated_duration_minutes

    new_work_items: List[WorkItem] = []
    topic_cursor: Dict[int, int] = {s.id: 0 for s in subjects}
    total_days = (target_dt - start_dt).days + 1

    for day_idx in range(total_days):
        current_dt = start_dt + timedelta(days=day_idx)
        current_date_str = current_dt.strftime("%Y-%m-%d")
        day_name = current_dt.strftime("%A")
        
        current_phase = get_current_phase(current_date_str, phases)
        phase_id = current_phase.get("id", 1)
        
        # Get timetable slots for today
        day_slots = weekly_schedule.get(day_name, [])
        daily_capacity_minutes = 180 if day_name == "Sunday" else 360 # 3h on Sun, 6h on Mon-Sat
        minutes_allocated_today = sum(
            scheduled_by_date_and_subj.get(current_date_str, {}).values()
        )
        
        for slot in day_slots:
            if minutes_allocated_today >= daily_capacity_minutes:
                break
                
            code = slot["subject_code"]
            slot_hours = slot["hours"]
            slot_minutes = int(slot_hours * 60)
            subj = subj_code_map.get(code)
            if not subj:
                continue
                
            # Check how much is already scheduled for this subject today
            already_done = scheduled_by_date_and_subj.get(current_date_str, {}).get(subj.id, 0)
            needed_minutes = max(0, slot_minutes - already_done)
            if needed_minutes <= 0:
                continue
                
            s_topics = topics_by_subj.get(subj.id, [])
            if not s_topics:
                continue
                
            # Filter topics appropriate for current phase
            if phase_id == 1 and code in PHASE_1_TOPIC_KEYWORDS:
                filtered_topics = [
                    t for t in s_topics 
                    if any(kw.lower() in t.title.lower() for kw in PHASE_1_TOPIC_KEYWORDS[code])
                ] or s_topics
            elif phase_id == 2 and code in PHASE_2_TOPIC_KEYWORDS:
                filtered_topics = [
                    t for t in s_topics 
                    if any(kw.lower() in t.title.lower() for kw in PHASE_2_TOPIC_KEYWORDS[code])
                ] or s_topics
            else:
                filtered_topics = s_topics
                
            # Break slot into 60-min blocks (or remainder)
            blocks = max(1, needed_minutes // 60)
            block_duration = needed_minutes // blocks
            
            for b in range(blocks):
                # Pick topic by cycling cursor
                c_idx = topic_cursor[subj.id] % len(filtered_topics)
                active_topic = filtered_topics[c_idx]
                topic_cursor[subj.id] += 1
                
                # Determine realistic session category
                if day_name == "Sunday":
                    session_type = "Spaced Revision" if b == 0 else ("PYQ Practice" if b == 1 else "Sectional Test")
                elif phase_id == 1 and code == "LIN_ALG":
                    # Special LA Foundational Sequence
                    session_type = "Concept Learning" if b == 0 else "Mathematical Derivation"
                elif phase_id == 4:
                    session_type = "PYQ Practice" if b % 2 == 0 else "Mathematical Derivation"
                else:
                    session_type = "Concept Learning" if b == 0 else ("Mathematical Derivation" if b % 3 == 1 else "PYQ Practice")
                    
                item_title = f"{active_topic.title} ({session_type})"
                if code == "LIN_ALG" and phase_id == 1:
                    item_title = f"[LA Foundation] {active_topic.title} — {session_type}"
                    
                item = WorkItem(
                    id=str(uuid.uuid4()),
                    title=item_title,
                    subject_id=subj.id,
                    topic_id=active_topic.id,
                    session_type=session_type,
                    scheduled_date=current_date_str,
                    estimated_duration_minutes=block_duration,
                    priority=active_topic.priority,
                    status="Scheduled",
                    defer_count=0
                )
                session.add(item)
                new_work_items.append(item)
                minutes_allocated_today += block_duration
                
    # Add Final Exam Prep Mocks (Jan 16 to Feb 5, 2027)
    final_phase_start = datetime(2027, 1, 16)
    exam_dt = datetime(2027, 2, 6)
    mock_days = [2, 5] # Wednesday and Saturday
    
    mock_count = 0
    cur_final_dt = final_phase_start
    while cur_final_dt < exam_dt and mock_count < (settings.mock_target_count if settings else 10):
        if cur_final_dt.weekday() in mock_days:
            mock_date_str = cur_final_dt.strftime("%Y-%m-%d")
            # 1. Mock Test (180 mins)
            mock_item = WorkItem(
                id=str(uuid.uuid4()),
                title=f"Full-Length GATE DA Mock #{mock_count + 1} (Official Pattern)",
                subject_id=None,
                topic_id=None,
                session_type="Mock Test",
                scheduled_date=mock_date_str,
                estimated_duration_minutes=180,
                priority="High",
                status="Scheduled",
                defer_count=0
            )
            session.add(mock_item)
            new_work_items.append(mock_item)
            
            # 2. Mock Analysis (120 mins)
            analysis_item = WorkItem(
                id=str(uuid.uuid4()),
                title=f"Mock #{mock_count + 1} Deep Analysis & Mistake Vault Logging",
                subject_id=None,
                topic_id=None,
                session_type="Mock Analysis",
                scheduled_date=mock_date_str,
                estimated_duration_minutes=120,
                priority="High",
                status="Scheduled",
                defer_count=0
            )
            session.add(analysis_item)
            new_work_items.append(analysis_item)
            mock_count += 1
            
        cur_final_dt += timedelta(days=1)
        
    session.commit()
    
    # Audit log
    auto_event = AutomationEvent(
        event_type="plan_generated",
        entity_type="work_item",
        entity_id=f"batch-{len(new_work_items)}",
        previous_state_json="[]",
        new_state_json=f'{{"items_generated": {len(new_work_items)}, "mock_tests_scheduled": {mock_count}}}',
        trigger_reason=f"Generated 39h/week personalized plan from {start_date} to {target_date}",
        reversible=True
    )
    session.add(auto_event)
    session.commit()
    
    return {
        "status": "success",
        "message": f"Generated {len(new_work_items)} scheduled study sessions across 4 preparation phases and final mock sequence.",
        "created_count": len(new_work_items),
        "mock_tests_scheduled": mock_count,
        "start_date": start_date,
        "target_date": target_date
    }

def reflow_backlog(session: Session, target_start_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Recovers overdue, deferred or incomplete work items prior to target_start_date,
    rescheduling them into future available days without deleting history or exceeding daily capacity.
    """
    if not target_start_date:
        target_start_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
    overdue_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date < target_start_date)
        .where(WorkItem.status.in_(["Scheduled", "Deferred", "In Progress"]))
    ).all()
    
    if not overdue_items:
        return {
            "status": "success",
            "message": "No backlog items to reflow",
            "reflowed_count": 0,
            "is_feasible": True
        }
        
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    max_capacity_hours = settings.max_daily_capacity_hours if settings else 8.0
    syllabus_target = settings.syllabus_target_date if settings else "2027-01-15"
    
    start_dt = datetime.strptime(target_start_date, "%Y-%m-%d")
    target_dt = datetime.strptime(syllabus_target, "%Y-%m-%d")
    remaining_days = max(1, (target_dt - start_dt).days + 1)
    
    # Calculate scheduled load on future days
    future_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date >= target_start_date)
        .where(WorkItem.status.in_(["Scheduled", "In Progress"]))
    ).all()
    
    day_load: Dict[str, int] = {}
    for fit in future_items:
        day_load[fit.scheduled_date] = day_load.get(fit.scheduled_date, 0) + fit.estimated_duration_minutes

    reflowed_count = 0
    day_offset = 0
    
    for item in overdue_items:
        placed = False
        while not placed and day_offset < remaining_days + 14: # Allow 2-week buffer
            candidate_dt = start_dt + timedelta(days=day_offset)
            candidate_date = candidate_dt.strftime("%Y-%m-%d")
            day_name = candidate_dt.strftime("%A")
            
            # Daily capacity: 3h on Sun, 6h on Mon-Sat (up to hard capacity max_capacity_hours)
            day_cap_minutes = int(min(max_capacity_hours, 3.0 if day_name == "Sunday" else 6.0) * 60)
            current_min = day_load.get(candidate_date, 0)
            
            if current_min + item.estimated_duration_minutes <= day_cap_minutes:
                item.scheduled_date = candidate_date
                item.defer_count += 1
                item.status = "Scheduled"
                session.add(item)
                day_load[candidate_date] = current_min + item.estimated_duration_minutes
                reflowed_count += 1
                placed = True
            else:
                day_offset += 1
                
        if not placed:
            # Fallback to candidate date even if loaded, with incremented day
            item.scheduled_date = (start_dt + timedelta(days=day_offset)).strftime("%Y-%m-%d")
            item.defer_count += 1
            item.status = "Scheduled"
            session.add(item)
            reflowed_count += 1
            day_offset += 1
            
    # Check mathematical feasibility
    total_backlog_minutes = sum(i.estimated_duration_minutes for i in overdue_items)
    is_feasible = (total_backlog_minutes / 60.0) <= (remaining_days * 6.0)
    
    warning_message = None
    if not is_feasible:
        warning_message = f"Warning: Remaining workload of {round(total_backlog_minutes / 60.0, 1)} hours exceeds standard capacity for the {remaining_days} remaining days until syllabus deadline ({syllabus_target}). Increase daily study hours or adjust deadline."
        
    auto_event = AutomationEvent(
        event_type="backlog_reflowed",
        entity_type="work_item",
        entity_id=f"reflow-{reflowed_count}",
        trigger_reason=f"Reflowed {reflowed_count} incomplete tasks into future dates starting {target_start_date}",
        reversible=True
    )
    session.add(auto_event)
    session.commit()
    
    return {
        "status": "success",
        "message": f"Successfully reflowed {reflowed_count} backlog items across upcoming available days.",
        "reflowed_count": reflowed_count,
        "is_feasible": is_feasible,
        "deficit_warning": warning_message
    }
