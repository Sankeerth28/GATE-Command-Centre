import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import MistakeLog, Subject, Topic
from app.services.srs_service import check_topic_mistake_triggers

router = APIRouter(prefix="/mistakes", tags=["Mistake Vault"])

@router.get("/")
def get_mistakes(
    subject_id: Optional[int] = Query(None),
    topic_id: Optional[int] = Query(None),
    error_category: Optional[str] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(MistakeLog)
    if subject_id:
        query = query.where(MistakeLog.subject_id == subject_id)
    if topic_id:
        query = query.where(MistakeLog.topic_id == topic_id)
    if error_category:
        query = query.where(MistakeLog.error_category == error_category)
    if is_resolved is not None:
        query = query.where(MistakeLog.is_resolved == is_resolved)
        
    items = session.exec(query.order_by(MistakeLog.created_at_utc.desc())).all()
    
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    topics = {t.id: t for t in session.exec(select(Topic)).all()}
    
    return [
        {
            **m.model_dump(),
            "subject_name": subjects.get(m.subject_id).name if m.subject_id in subjects else None,
            "subject_color": subjects.get(m.subject_id).color if m.subject_id in subjects else "#6366F1",
            "topic_title": topics.get(m.topic_id).title if m.topic_id in topics else None
        }
        for m in items
    ]

@router.post("/")
def create_mistake(payload: dict, session: Session = Depends(get_session)):
    mistake = MistakeLog(
        id=str(uuid.uuid4()),
        mock_test_id=payload.get("mock_test_id"),
        subject_id=payload["subject_id"],
        topic_id=payload.get("topic_id"),
        question_text=payload["question_text"],
        question_type=payload.get("question_type", "1-mark MCQ"),
        marks=payload.get("marks", 1.0),
        error_category=payload.get("error_category", "Conceptual Gap"),
        your_answer=payload.get("your_answer"),
        correct_answer=payload.get("correct_answer"),
        solution_notes=payload.get("solution_notes"),
        image_url=payload.get("image_url"),
        is_resolved=False
    )
    session.add(mistake)
    session.commit()
    session.refresh(mistake)
    
    if mistake.topic_id:
        check_topic_mistake_triggers(session, mistake.topic_id)
        
    return mistake

@router.put("/{mistake_id}/resolve")
def resolve_mistake(
    mistake_id: str,
    payload: Optional[dict] = None,
    session: Session = Depends(get_session)
):
    mistake = session.exec(select(MistakeLog).where(MistakeLog.id == mistake_id)).first()
    if not mistake:
        raise HTTPException(status_code=404, detail="Mistake record not found")
        
    is_resolved = payload.get("is_resolved", True) if payload else True
    mistake.is_resolved = is_resolved
    mistake.resolved_at_utc = datetime.now(timezone.utc).isoformat() if is_resolved else None
    session.add(mistake)
    session.commit()
    session.refresh(mistake)
    return mistake
