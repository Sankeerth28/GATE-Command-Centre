from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import InteractionRecord
from app.services.interaction_service import (
    get_morning_checkin_context, process_morning_checkin,
    get_evening_review_context, process_evening_review,
    process_task_completion_feedback
)

router = APIRouter(prefix="/interactions", tags=["Intelligent Interaction Engine"])

@router.get("/morning-checkin")
def morning_checkin_context(
    date: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    return get_morning_checkin_context(session, today_str=date)

@router.post("/morning-checkin")
def submit_morning_checkin(
    payload: dict,
    session: Session = Depends(get_session)
):
    today_str = payload.get("interaction_date")
    answers = payload.get("answers", {})
    return process_morning_checkin(session, today_str=today_str, answers=answers)

@router.get("/evening-review")
def evening_review_context(
    date: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    return get_evening_review_context(session, today_str=date)

@router.post("/evening-review")
def submit_evening_review(
    payload: dict,
    session: Session = Depends(get_session)
):
    today_str = payload.get("interaction_date")
    answers = payload.get("answers", {})
    return process_evening_review(session, today_str=today_str, answers=answers)

@router.post("/task-completion")
def submit_task_completion(
    payload: dict,
    session: Session = Depends(get_session)
):
    work_item_id = payload.get("work_item_id")
    confidence_rating = payload.get("confidence_rating", "Average")
    practiced_questions = payload.get("practiced_questions", False)
    questions_count = payload.get("questions_count", 0)
    session_id = payload.get("session_id")
    
    return process_task_completion_feedback(
        session=session,
        work_item_id=work_item_id,
        confidence_rating=confidence_rating,
        practiced_questions=practiced_questions,
        questions_count=questions_count,
        session_id=session_id
    )

@router.get("/history")
def get_interaction_history(
    limit: int = 20,
    session: Session = Depends(get_session)
):
    return session.exec(
        select(InteractionRecord)
        .order_by(InteractionRecord.created_at_utc.desc())
        .limit(limit)
    ).all()
