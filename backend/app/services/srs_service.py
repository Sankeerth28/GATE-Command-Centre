from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from sqlmodel import Session, select
from app.models.models import Topic, RevisionRecord, AutomationEvent, MistakeLog

CONFIDENCE_INTERVALS = {
    "Weak": [1],
    "Average": [3],
    "Good": [1, 3, 7, 14, 30],
    "Strong": [21, 45, 90]
}

def calculate_next_revision_date(confidence: str, current_count: int, base_date: Optional[datetime] = None) -> Tuple[int, str]:
    """Calculates interval days and next revision date string (YYYY-MM-DD) based on confidence."""
    if base_date is None:
        base_date = datetime.now(timezone.utc)
        
    intervals = CONFIDENCE_INTERVALS.get(confidence, [3])
    idx = min(current_count, len(intervals) - 1)
    interval_days = intervals[idx]
    
    next_date = (base_date + timedelta(days=interval_days)).strftime("%Y-%m-%d")
    return interval_days, next_date

def record_topic_revision(
    session: Session,
    topic_id: int,
    confidence_rating: str,
    notes: Optional[str] = None
) -> Tuple[Topic, RevisionRecord]:
    topic = session.exec(select(Topic).where(Topic.id == topic_id)).first()
    if not topic:
        raise ValueError(f"Topic {topic_id} not found")
        
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    prev_next_date = topic.next_revision_date
    
    interval_days, calculated_next = calculate_next_revision_date(
        confidence_rating,
        topic.revision_count
    )
    
    # Create revision record
    revision_record = RevisionRecord(
        topic_id=topic.id,
        revision_date=today_str,
        interval_days=interval_days,
        confidence_rating=confidence_rating,
        previous_next_date=prev_next_date,
        calculated_next_date=calculated_next,
        notes=notes
    )
    session.add(revision_record)
    
    # Update topic
    old_state = {
        "status": topic.status,
        "confidence": topic.confidence,
        "revision_count": topic.revision_count,
        "next_revision_date": topic.next_revision_date
    }
    
    topic.confidence = confidence_rating
    topic.revision_count += 1
    topic.last_revised_date = today_str
    topic.next_revision_date = calculated_next
    
    if confidence_rating == "Strong" and topic.revision_count >= 3:
        topic.status = "Mastered"
        topic.mastery_confirmed = True
    elif topic.status == "Needs Revision" or topic.status == "Not Started":
        topic.status = "In Progress"
        
    session.add(topic)
    
    # Log automation event
    auto_event = AutomationEvent(
        event_type="topic_confidence_updated",
        entity_type="topic",
        entity_id=str(topic.id),
        previous_state_json=str(old_state),
        new_state_json=str({
            "status": topic.status,
            "confidence": topic.confidence,
            "revision_count": topic.revision_count,
            "next_revision_date": topic.next_revision_date
        }),
        trigger_reason=f"Revision recorded with confidence {confidence_rating}",
        reversible=True
    )
    session.add(auto_event)
    
    session.commit()
    session.refresh(topic)
    session.refresh(revision_record)
    return topic, revision_record

def check_topic_mistake_triggers(session: Session, topic_id: int) -> bool:
    """Checks if a topic has 3 or more unresolved mistakes; if so, marks status as 'Needs Revision'."""
    unresolved_count = len(session.exec(
        select(MistakeLog)
        .where(MistakeLog.topic_id == topic_id)
        .where(MistakeLog.is_resolved == False)
    ).all())
    
    if unresolved_count >= 3:
        topic = session.exec(select(Topic).where(Topic.id == topic_id)).first()
        if topic and topic.status != "Needs Revision":
            old_status = topic.status
            topic.status = "Needs Revision"
            session.add(topic)
            
            auto_event = AutomationEvent(
                event_type="revision_flagged",
                entity_type="topic",
                entity_id=str(topic.id),
                previous_state_json=f'{{"status": "{old_status}"}}',
                new_state_json='{"status": "Needs Revision"}',
                trigger_reason=f"Accumulated {unresolved_count} unresolved mistakes in Topic: {topic.title}",
                reversible=True
            )
            session.add(auto_event)
            session.commit()
            return True
    return False
