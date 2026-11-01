from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import MockTest, MockSubjectResult, Subject
from app.services.mock_service import MockTestCreate, process_mock_test_submission

router = APIRouter(prefix="/mocks", tags=["Mock Tests"])

@router.get("/")
def get_mock_tests(session: Session = Depends(get_session)):
    return session.exec(select(MockTest).order_by(MockTest.test_date.desc())).all()

@router.post("/")
def create_mock_test(payload: MockTestCreate, session: Session = Depends(get_session)):
    return process_mock_test_submission(session, payload)

@router.get("/{mock_id}")
def get_mock_test_detail(mock_id: str, session: Session = Depends(get_session)):
    mock_test = session.exec(select(MockTest).where(MockTest.id == mock_id)).first()
    if not mock_test:
        raise HTTPException(status_code=404, detail="Mock test not found")
        
    subject_results = session.exec(
        select(MockSubjectResult).where(MockSubjectResult.mock_test_id == mock_id)
    ).all()
    
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    
    enriched_results = [
        {
            **sr.model_dump(),
            "subject_name": subjects.get(sr.subject_id).name if sr.subject_id in subjects else "Unknown",
            "subject_color": subjects.get(sr.subject_id).color if sr.subject_id in subjects else "#6366F1"
        }
        for sr in subject_results
    ]
    
    return {
        "mock_test": mock_test,
        "subject_breakdown": enriched_results
    }
