import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from sqlmodel import Session, select
from app.models.models import (
    InteractionRecord, WorkItem, StudySession, Topic, Subject,
    UserSettings, AutomationEvent
)
from app.services.srs_service import record_topic_revision

def check_existing_checkin(session: Session, interaction_type: str, date_str: str) -> Optional[InteractionRecord]:
    """Finds if an interaction of given type was already recorded for the given date."""
    return session.exec(
        select(InteractionRecord)
        .where(InteractionRecord.interaction_type == interaction_type)
        .where(InteractionRecord.interaction_date == date_str)
        .where(InteractionRecord.status == "completed")
    ).first()

def get_morning_checkin_context(session: Session, today_str: Optional[str] = None) -> Dict[str, Any]:
    if not today_str:
        today_str = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")
        
    today_dt = datetime.strptime(today_str, "%Y-%m-%d")
    yesterday_str = (today_dt - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # 1. Check idempotency
    existing = check_existing_checkin(session, "morning_checkin", today_str)
        
    # 2. Retrieve yesterday's activities and actual duration
    yesterday_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date == yesterday_str)
    ).all()
    
    # Yesterday's logged sessions
    yesterday_sessions = session.exec(
        select(StudySession)
        .where(StudySession.start_timestamp.startswith(yesterday_str))
    ).all()
    yesterday_logged_seconds = sum(s.duration_seconds for s in yesterday_sessions)
    yesterday_logged_hours = round(yesterday_logged_seconds / 3600.0, 1)
    
    # 3. Retrieve today's planned items
    today_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date == today_str)
    ).all()
    
    # 4. Pending / Overdue items
    overdue_count = len(session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date < today_str)
        .where(WorkItem.status.in_(["Scheduled", "In Progress", "Deferred"]))
    ).all())
    
    return {
        "already_completed": bool(existing),
        "existing_answers": json.loads(existing.metadata_json) if existing and existing.metadata_json else None,
        "interaction_date": today_str,
        "yesterday_date": yesterday_str,
        "yesterday_planned_count": len(yesterday_items),
        "yesterday_completed_count": sum(1 for i in yesterday_items if i.status == "Completed"),
        "yesterday_logged_hours": yesterday_logged_hours,
        "yesterday_items": [
            {"id": i.id, "title": i.title, "status": i.status, "topic_id": i.topic_id}
            for i in yesterday_items
        ],
        "today_planned_count": len(today_items),
        "today_estimated_hours": round(sum(i.estimated_duration_minutes for i in today_items) / 60.0, 1),
        "today_items": [
            {"id": i.id, "title": i.title, "priority": i.priority, "session_type": i.session_type}
            for i in today_items
        ],
        "overdue_count": overdue_count,
        "questions": [
            {
                "id": "q1_yesterday_completion",
                "question": "Did you complete yesterday's planned study work?",
                "options": [
                    {"label": "Completed everything", "value": "all"},
                    {"label": "Partially completed", "value": "partial"},
                    {"label": "Could not complete it", "value": "none"}
                ]
            },
            {
                "id": "q2_today_availability",
                "question": "Are you available to follow today's schedule?",
                "options": [
                    {"label": "Full availability (4+ hours)", "value": "full"},
                    {"label": "Limited availability (2 hours)", "value": "limited"},
                    {"label": "Not available today", "value": "none"}
                ]
            },
            {
                "id": "q3_readiness",
                "question": "How would you like today's workload?",
                "options": [
                    {"label": "Normal schedule", "value": "normal"},
                    {"label": "Lighter schedule", "value": "lighter"},
                    {"label": "More challenging practice", "value": "challenging"}
                ]
            }
        ]
    }

def process_morning_checkin(
    session: Session,
    today_str: Optional[str],
    answers: Dict[str, Any]
) -> Dict[str, Any]:
    """Processes user answers and updates tasks and schedule accordingly."""
    if not today_str:
        today_str = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")

    q1 = answers.get("q1_yesterday_completion") # all, partial, none
    q2 = answers.get("q2_today_availability")   # full, limited, none
    q3 = answers.get("q3_readiness")            # normal, lighter, challenging
    incomplete_ids = answers.get("incomplete_item_ids", [])
    
    today_dt = datetime.strptime(today_str, "%Y-%m-%d")
    yesterday_str = (today_dt - timedelta(days=1)).strftime("%Y-%m-%d")
    
    # Process yesterday's items
    yesterday_items = session.exec(
        select(WorkItem).where(WorkItem.scheduled_date == yesterday_str)
    ).all()
    
    for item in yesterday_items:
        if q1 == "all":
            if item.status != "Completed":
                item.status = "Completed"
                item.completion_timestamp = datetime.now(timezone.utc).isoformat()
                session.add(item)
        elif q1 == "partial":
            if item.id in incomplete_ids:
                item.status = "Deferred"
                item.defer_count += 1
                session.add(item)
            elif item.status != "Completed":
                item.status = "Completed"
                item.completion_timestamp = datetime.now(timezone.utc).isoformat()
                session.add(item)
        elif q1 == "none":
            if item.status != "Completed":
                item.status = "Deferred"
                item.defer_count += 1
                session.add(item)
                
    # Process today's workload adjustment
    if q2 == "limited" or q3 == "lighter":
        today_items = session.exec(
            select(WorkItem)
            .where(WorkItem.scheduled_date == today_str)
            .where(WorkItem.status == "Scheduled")
        ).all()
        # Keep high priority, defer lower priority items
        if len(today_items) > 2:
            items_to_defer = [i for i in today_items if i.priority != "High"]
            tomorrow_str = (today_dt + timedelta(days=1)).strftime("%Y-%m-%d")
            for item in items_to_defer[:2]:
                item.scheduled_date = tomorrow_str
                item.defer_count += 1
                session.add(item)
                
    # Record or update interaction
    existing = check_existing_checkin(session, "morning_checkin", today_str)
    if existing:
        record = existing
        record.selected_answer = f"q1:{q1}|q2:{q2}|q3:{q3}"
        record.metadata_json = json.dumps(answers)
        record.completed_at_utc = datetime.now(timezone.utc).isoformat()
    else:
        record = InteractionRecord(
            interaction_type="morning_checkin",
            interaction_date=today_str,
            current_question="Morning Check-in (Yesterday Completion & Today Availability)",
            selected_answer=f"q1:{q1}|q2:{q2}|q3:{q3}",
            metadata_json=json.dumps(answers),
            status="completed",
            completed_at_utc=datetime.now(timezone.utc).isoformat()
        )
    session.add(record)
    session.commit()
    
    return {
        "status": "success",
        "message": "Morning check-in confirmed! Preparation queue and streak updated.",
        "interaction_id": record.id
    }

def get_evening_review_context(session: Session, today_str: Optional[str] = None) -> Dict[str, Any]:
    if not today_str:
        today_str = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")
        
    existing = check_existing_checkin(session, "evening_review", today_str)
        
    today_items = session.exec(
        select(WorkItem).where(WorkItem.scheduled_date == today_str)
    ).all()
    
    today_sessions = session.exec(
        select(StudySession).where(StudySession.start_timestamp.startswith(today_str))
    ).all()
    today_logged_hours = round(sum(s.duration_seconds for s in today_sessions) / 3600.0, 1)
    
    return {
        "already_completed": bool(existing),
        "existing_answers": json.loads(existing.metadata_json) if existing and existing.metadata_json else None,
        "interaction_date": today_str,
        "today_planned_count": len(today_items),
        "today_completed_count": sum(1 for i in today_items if i.status == "Completed"),
        "today_logged_hours": today_logged_hours,
        "today_items": [{"id": i.id, "title": i.title, "status": i.status} for i in today_items],
        "questions": [
            {
                "id": "q1_today_status",
                "question": "Did you complete today's scheduled work?",
                "options": [
                    {"label": "Completed all planned work", "value": "all"},
                    {"label": "Mostly completed", "value": "mostly"},
                    {"label": "Pending items remain", "value": "partial"},
                    {"label": "Could not study today", "value": "none"}
                ]
            },
            {
                "id": "q2_rating",
                "question": "How would you rate today's preparation quality?",
                "options": [
                    {"label": "High Focus & Productive", "value": "high"},
                    {"label": "Good Progress", "value": "good"},
                    {"label": "Average / Distracted", "value": "average"},
                    {"label": "Low Energy / Stagnant", "value": "low"}
                ]
            },
            {
                "id": "q3_comfort",
                "question": "Are you comfortable with tomorrow's workload?",
                "options": [
                    {"label": "Ready for tomorrow's schedule", "value": "ready"},
                    {"label": "Prefer a lighter schedule", "value": "lighter"},
                    {"label": "Want extra practice scheduled", "value": "challenging"}
                ]
            }
        ]
    }

def process_evening_review(session: Session, today_str: Optional[str], answers: Dict[str, Any]) -> Dict[str, Any]:
    if not today_str:
        today_str = (datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)).strftime("%Y-%m-%d")

    q1 = answers.get("q1_today_status")
    q2 = answers.get("q2_rating")
    q3 = answers.get("q3_comfort")

    # If partial or none or lighter, defer pending tasks to tomorrow
    if q1 in ["partial", "none"] or q3 == "lighter":
        today_dt = datetime.strptime(today_str, "%Y-%m-%d")
        tomorrow_str = (today_dt + timedelta(days=1)).strftime("%Y-%m-%d")
        incomplete_items = session.exec(
            select(WorkItem)
            .where(WorkItem.scheduled_date == today_str)
            .where(WorkItem.status.in_(["Scheduled", "In Progress"]))
        ).all()
        for it in incomplete_items:
            it.scheduled_date = tomorrow_str
            it.defer_count += 1
            session.add(it)

    existing = check_existing_checkin(session, "evening_review", today_str)
    if existing:
        record = existing
        record.selected_answer = f"q1:{q1}|q2:{q2}|q3:{q3}"
        record.metadata_json = json.dumps(answers)
        record.completed_at_utc = datetime.now(timezone.utc).isoformat()
    else:
        record = InteractionRecord(
            interaction_type="evening_review",
            interaction_date=today_str,
            current_question="Evening Review",
            selected_answer=f"q1:{q1}|q2:{q2}|q3:{q3}",
            metadata_json=json.dumps(answers),
            status="completed",
            completed_at_utc=datetime.now(timezone.utc).isoformat()
        )
    session.add(record)
    session.commit()
    return {"status": "success", "message": "Evening review saved successfully. Streak and daily reflections logged."}

def process_task_completion_feedback(
    session: Session,
    work_item_id: Optional[str] = None,
    confidence_rating: str = "Average", # Weak, Average, Good, Strong
    practiced_questions: bool = False,
    questions_count: int = 0,
    session_id: Optional[str] = None
) -> Dict[str, Any]:
    """Handles prompt after study session or completing a work item."""
    work_item = None
    if work_item_id:
        work_item = session.exec(select(WorkItem).where(WorkItem.id == work_item_id)).first()
        if work_item:
            work_item.status = "Completed"
            work_item.completion_timestamp = datetime.now(timezone.utc).isoformat()
            session.add(work_item)
    
    topic = None
    if work_item and work_item.topic_id:
        topic, revision_record = record_topic_revision(
            session=session,
            topic_id=work_item.topic_id,
            confidence_rating=confidence_rating,
            notes=f"Completed session with {questions_count} questions practiced."
        )
        if practiced_questions and questions_count > 0:
            topic.pyqs_solved += questions_count
            session.add(topic)
            session.commit()
            
    if session_id:
        study_session = session.exec(select(StudySession).where(StudySession.id == session_id)).first()
        if study_session:
            study_session.confidence_rating = confidence_rating
            study_session.questions_practiced = questions_count
            session.add(study_session)
            session.commit()
            if study_session.topic_id and not topic:
                topic, _ = record_topic_revision(
                    session=session,
                    topic_id=study_session.topic_id,
                    confidence_rating=confidence_rating,
                    notes=f"Completed study session with {questions_count} questions practiced."
                )
            
    # Record in interaction_records
    interaction = InteractionRecord(
        interaction_type="task_completion",
        interaction_date=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        current_question="Study session completion feedback",
        selected_answer=f"confidence:{confidence_rating}|questions:{questions_count}",
        metadata_json=json.dumps({
            "work_item_id": work_item_id,
            "topic_id": work_item.topic_id if work_item else None,
            "confidence": confidence_rating,
            "questions_count": questions_count
        }),
        related_work_item_id=work_item.id if work_item else None,
        status="completed",
        completed_at_utc=datetime.now(timezone.utc).isoformat()
    )
    session.add(interaction)
    session.commit()
    
    return {
        "status": "success",
        "message": "Study session reconciled and next revision scheduled.",
        "next_revision_date": topic.next_revision_date if topic else None
    }
