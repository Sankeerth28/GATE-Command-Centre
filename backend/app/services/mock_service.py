import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from sqlmodel import Session, select
from app.models.models import MockTest, MockSubjectResult, MistakeLog
from app.services.srs_service import check_topic_mistake_triggers

class QuestionInput(BaseModel):
    subject_id: int
    topic_id: Optional[int] = None
    question_type: str # "1-mark MCQ", "2-mark MCQ", "1-mark MSQ", "2-mark MSQ", "1-mark NAT", "2-mark NAT"
    user_status: str   # "correct", "incorrect", "unattempted"
    question_text: Optional[str] = None
    error_category: Optional[str] = None
    solution_notes: Optional[str] = None
    your_answer: Optional[str] = None
    correct_answer: Optional[str] = None

class MockTestCreate(BaseModel):
    title: str
    provider: str = "Self-Administered"
    test_type: str = "Full-Length Mock" # Full-Length Mock, Subject Test, Topic Test, Previous Year Paper
    test_date: str # YYYY-MM-DD
    time_taken_minutes: int = 180
    notes: Optional[str] = None
    rank: Optional[int] = None
    percentile: Optional[float] = None
    questions: List[QuestionInput]

def score_question(q_type: str, status: str) -> tuple[float, float]:
    """Returns (positive_marks, negative_penalty)."""
    if status == "unattempted":
        return 0.0, 0.0
        
    marks = 2.0 if "2-mark" in q_type else 1.0
    
    if status == "correct":
        return marks, 0.0
        
    # Incorrect
    if "MCQ" in q_type:
        penalty = (2.0 / 3.0) if marks == 2.0 else (1.0 / 3.0)
        return 0.0, penalty
    else:
        # MSQ and NAT have 0 negative marking in GATE DA
        return 0.0, 0.0

def process_mock_test_submission(session: Session, data: MockTestCreate) -> MockTest:
    total_questions = len(data.questions)
    attempted = 0
    correct_count = 0
    incorrect_count = 0
    unattempted_count = 0
    
    gross_positive = 0.0
    negative_lost = 0.0
    
    subject_stats: Dict[int, Dict[str, Any]] = {}
    
    mistakes_created = []
    
    for q in data.questions:
        # Initialize subject stat
        if q.subject_id not in subject_stats:
            subject_stats[q.subject_id] = {
                "total": 0,
                "attempted": 0,
                "correct": 0,
                "incorrect": 0,
                "obtained": 0.0,
                "negative": 0.0
            }
            
        stat = subject_stats[q.subject_id]
        stat["total"] += 1
        
        pos, neg = score_question(q.question_type, q.user_status)
        net_q = pos - neg
        
        gross_positive += pos
        negative_lost += neg
        
        stat["obtained"] += net_q
        stat["negative"] += neg
        
        if q.user_status == "correct":
            correct_count += 1
            attempted += 1
            stat["correct"] += 1
            stat["attempted"] += 1
        elif q.user_status == "incorrect":
            incorrect_count += 1
            attempted += 1
            stat["incorrect"] += 1
            stat["attempted"] += 1
            
            # Record in Mistake Vault if question text or error category provided
            q_marks = 2.0 if "2-mark" in q.question_type else 1.0
            mistake = MistakeLog(
                id=str(uuid.uuid4()),
                mock_test_id=None, # Will link below
                subject_id=q.subject_id,
                topic_id=q.topic_id,
                question_text=q.question_text or f"Question ({q.question_type}) in Mock Test: {data.title}",
                question_type=q.question_type,
                marks=q_marks,
                error_category=q.error_category or "Conceptual Gap",
                your_answer=q.your_answer,
                correct_answer=q.correct_answer,
                solution_notes=q.solution_notes,
                is_resolved=False
            )
            mistakes_created.append(mistake)
        else:
            unattempted_count += 1
            
    net_score = round(gross_positive - negative_lost, 2)
    total_marks = sum(2.0 if "2-mark" in q.question_type else 1.0 for q in data.questions) if data.questions else 100.0
    
    accuracy_pct = round((correct_count / attempted * 100.0), 2) if attempted > 0 else 0.0
    attempt_rate_pct = round((attempted / total_questions * 100.0), 2) if total_questions > 0 else 0.0
    
    mock_record = MockTest(
        id=str(uuid.uuid4()),
        title=data.title,
        provider=data.provider,
        test_type=data.test_type,
        test_date=data.test_date,
        time_taken_minutes=data.time_taken_minutes,
        total_marks=total_marks,
        marks_obtained=net_score,
        gross_positive_marks=round(gross_positive, 2),
        negative_marks_lost=round(negative_lost, 2),
        questions_attempted=attempted,
        correct_count=correct_count,
        incorrect_count=incorrect_count,
        unattempted_count=unattempted_count,
        accuracy_pct=accuracy_pct,
        attempt_rate_pct=attempt_rate_pct,
        rank=data.rank,
        percentile=data.percentile,
        notes=data.notes
    )
    session.add(mock_record)
    session.commit()
    session.refresh(mock_record)
    
    # Save subject breakdowns
    for subj_id, s_data in subject_stats.items():
        sub_res = MockSubjectResult(
            id=str(uuid.uuid4()),
            mock_test_id=mock_record.id,
            subject_id=subj_id,
            total_questions=s_data["total"],
            attempted=s_data["attempted"],
            correct=s_data["correct"],
            incorrect=s_data["incorrect"],
            marks_obtained=round(s_data["obtained"], 2),
            negative_marks=round(s_data["negative"], 2)
        )
        session.add(sub_res)
        
    # Save mistake logs and check for 3+ mistakes trigger
    for m in mistakes_created:
        m.mock_test_id = mock_record.id
        session.add(m)
        if m.topic_id:
            check_topic_mistake_triggers(session, m.topic_id)
            
    session.commit()
    session.refresh(mock_record)
    return mock_record
