import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import StudySession, WorkItem, Topic, Subject

router = APIRouter(prefix="/sessions", tags=["Study Sessions"])

@router.get("/")
def get_study_sessions(
    limit: int = 20,
    session: Session = Depends(get_session)
):
    sessions = session.exec(
        select(StudySession)
        .order_by(StudySession.start_timestamp.desc())
        .limit(limit)
    ).all()
    
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    topics = {t.id: t for t in session.exec(select(Topic)).all()}
    
    return [
        {
            **s.model_dump(),
            "subject_name": subjects.get(s.subject_id).name if s.subject_id in subjects else None,
            "subject_color": subjects.get(s.subject_id).color if s.subject_id in subjects else "#6366F1",
            "topic_title": topics.get(s.topic_id).title if s.topic_id in topics else None
        }
        for s in sessions
    ]

@router.post("/")
def create_study_session(payload: dict, session: Session = Depends(get_session)):
    duration_sec = payload.get("duration_seconds", 0)
    session_record = StudySession(
        id=payload.get("id") or str(uuid.uuid4()),
        work_item_id=payload.get("work_item_id"),
        topic_id=payload.get("topic_id"),
        subject_id=payload.get("subject_id"),
        session_type=payload.get("session_type", "Concept Learning"),
        start_timestamp=payload.get("start_timestamp", datetime.now(timezone.utc).isoformat()),
        end_timestamp=payload.get("end_timestamp", datetime.now(timezone.utc).isoformat()),
        duration_seconds=duration_sec,
        mode=payload.get("mode", "Pomodoro"),
        questions_practiced=payload.get("questions_practiced", 0),
        confidence_rating=payload.get("confidence_rating")
    )
    session.add(session_record)
    
    # Update Topic actual hours if topic_id provided
    if session_record.topic_id:
        topic = session.exec(select(Topic).where(Topic.id == session_record.topic_id)).first()
        if topic:
            topic.actual_hours = round(topic.actual_hours + (duration_sec / 3600.0), 2)
            topic.last_studied_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            session.add(topic)
            
    # Update WorkItem actual minutes if work_item_id provided
    if session_record.work_item_id:
        work_item = session.exec(select(WorkItem).where(WorkItem.id == session_record.work_item_id)).first()
        if work_item:
            work_item.actual_duration_minutes += int(duration_sec / 60)
            session.add(work_item)
            
    session.commit()
    session.refresh(session_record)
    return session_record
