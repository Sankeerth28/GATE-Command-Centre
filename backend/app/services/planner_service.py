import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from app.models.models import (
    Topic, Subject, WorkItem, UserSettings, AutomationEvent
)

def generate_study_plan(
    session: Session,
    start_date: Optional[str] = None,
    target_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a structured day-wise study schedule from start_date to target_date
    prioritizing uncompleted topics, respecting daily target hours, and interleaving subjects.
    """
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    daily_hours = settings.daily_target_hours if settings else 4.0
    
    if not start_date:
        start_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if not target_date:
        target_date = settings.syllabus_target_date if settings else "2027-01-15"
        
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    target_dt = datetime.strptime(target_date, "%Y-%m-%d")
    
    if target_dt <= start_dt:
        target_dt = start_dt + timedelta(days=90)
        
    total_available_days = (target_dt - start_dt).days + 1
    
    # Fetch all subjects and uncompleted topics
    subjects = session.exec(select(Subject).order_by(Subject.display_order)).all()
    subject_map = {s.id: s for s in subjects}
    
    topics = session.exec(
        select(Topic)
        .where(Topic.status.in_(["Not Started", "In Progress", "Needs Revision"]))
        .order_by(Topic.priority.desc(), Topic.estimated_hours.desc())
    ).all()
    
    if not topics:
        return {"status": "success", "message": "All topics already completed!", "created_count": 0}
        
    # Check existing future scheduled work items to avoid duplicate duplication
    existing_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date >= start_date)
        .where(WorkItem.status == "Scheduled")
    ).all()
    
    scheduled_topic_ids = {item.topic_id for item in existing_items if item.topic_id}
    
    new_work_items: List[WorkItem] = []
    current_day_offset = 0
    current_day_minutes_used = 0
    max_day_minutes = int(daily_hours * 60)
    
    # Priority sorting based on subject baseline & topic priority
    def topic_sort_key(t: Topic):
        subj = subject_map.get(t.subject_id)
        is_weak_subj = subj and ("Weak" in subj.baseline_level)
        prio_weight = 3 if t.priority == "High" else (2 if t.priority == "Medium" else 1)
        subj_weight = 2 if is_weak_subj else 1
        return (prio_weight * subj_weight, t.estimated_hours)
        
    sorted_topics = sorted(topics, key=topic_sort_key, reverse=True)
    
    for topic in sorted_topics:
        if topic.id in scheduled_topic_ids:
            continue
            
        remaining_hours = max(1.0, topic.estimated_hours - topic.actual_hours)
        session_blocks = int(remaining_hours * 60 / 60) # 60-min blocks
        if session_blocks == 0:
            session_blocks = 1
            
        for b in range(session_blocks):
            if current_day_offset >= total_available_days:
                break
                
            block_date = (start_dt + timedelta(days=current_day_offset)).strftime("%Y-%m-%d")
            
            # Decide session type: first block concept, subsequent math/pyq
            session_type = "Concept Learning" if b == 0 else ("Mathematical Practice" if b % 2 == 1 else "PYQ Practice")
            
            item = WorkItem(
                id=str(uuid.uuid4()),
                title=f"{topic.title} — Part {b + 1} ({session_type})",
                subject_id=topic.subject_id,
                topic_id=topic.id,
                session_type=session_type,
                scheduled_date=block_date,
                estimated_duration_minutes=60,
                priority=topic.priority,
                status="Scheduled",
                defer_count=0
            )
            session.add(item)
            new_work_items.append(item)
            
            current_day_minutes_used += 60
            if current_day_minutes_used >= max_day_minutes:
                current_day_offset += 1
                current_day_minutes_used = 0
                
    # Add weekly Spaced Revision & Aptitude booster sessions
    for d in range(6, min(total_available_days, 180), 7):
        rev_date = (start_dt + timedelta(days=d)).strftime("%Y-%m-%d")
        rev_item = WorkItem(
            id=str(uuid.uuid4()),
            title="Weekly Spaced Revision & Formula Practice",
            subject_id=None,
            topic_id=None,
            session_type="Spaced Revision",
            scheduled_date=rev_date,
            estimated_duration_minutes=90,
            priority="High",
            status="Scheduled",
            defer_count=0
        )
        session.add(rev_item)
        new_work_items.append(rev_item)
        
    session.commit()
    
    # Audit event
    auto_event = AutomationEvent(
        event_type="plan_generated",
        entity_type="work_item",
        entity_id=f"batch-{len(new_work_items)}",
        previous_state_json="[]",
        new_state_json=f'{{"items_generated": {len(new_work_items)}}}',
        trigger_reason=f"Study plan generated from {start_date} to {target_date}",
        reversible=True
    )
    session.add(auto_event)
    session.commit()
    
    return {
        "status": "success",
        "message": f"Generated {len(new_work_items)} study work items.",
        "created_count": len(new_work_items),
        "target_date": target_date
    }

def reflow_backlog(session: Session, target_start_date: Optional[str] = None) -> Dict[str, Any]:
    """
    Recovers overdue, deferred or incomplete work items prior to target_start_date,
    rescheduling them into future available days without deleting history.
    """
    if not target_start_date:
        target_start_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        
    # Find unfinished work items from the past
    overdue_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date < target_start_date)
        .where(WorkItem.status.in_(["Scheduled", "Deferred", "In Progress"]))
    ).all()
    
    if not overdue_items:
        return {"status": "success", "message": "No backlog items to reflow", "reflowed_count": 0}
        
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    daily_capacity = settings.max_daily_capacity_hours if settings else 8.0
    
    start_dt = datetime.strptime(target_start_date, "%Y-%m-%d")
    current_day_offset = 0
    reflowed_count = 0
    
    for item in overdue_items:
        prev_date = item.scheduled_date
        new_date = (start_dt + timedelta(days=current_day_offset)).strftime("%Y-%m-%d")
        
        item.scheduled_date = new_date
        item.defer_count += 1
        item.status = "Scheduled"
        session.add(item)
        reflowed_count += 1
        
        # Advance by 1 day every 2 items to prevent overload
        if reflowed_count % 2 == 0:
            current_day_offset += 1
            
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
        "message": f"Successfully reflowed {reflowed_count} backlog items.",
        "reflowed_count": reflowed_count
    }
