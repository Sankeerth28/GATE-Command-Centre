import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import Subject, Chapter, Topic, MistakeLog, JournalEntry, RevisionRecord
from app.services.srs_service import record_topic_revision, check_topic_mistake_triggers

router = APIRouter(prefix="/syllabus", tags=["Syllabus"])

@router.get("/subjects")
def get_subjects(session: Session = Depends(get_session)):
    subjects = session.exec(select(Subject).order_by(Subject.display_order)).all()
    topics = session.exec(select(Topic)).all()
    
    result = []
    for s in subjects:
        s_topics = [t for t in topics if t.subject_id == s.id]
        total_est = sum(t.estimated_hours for t in s_topics)
        weighted_sum = sum((t.completion_percentage / 100.0) * t.estimated_hours for t in s_topics)
        comp_pct = round((weighted_sum / total_est * 100.0), 1) if total_est > 0 else 0.0
        
        result.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "icon": s.icon,
            "color": s.color,
            "exam_weightage": s.exam_weightage,
            "baseline_level": s.baseline_level,
            "display_order": s.display_order,
            "topic_count": len(s_topics),
            "completed_count": sum(1 for t in s_topics if t.status in ["Completed", "Mastered"]),
            "estimated_hours": total_est,
            "actual_hours": sum(t.actual_hours for t in s_topics),
            "completion_percentage": comp_pct
        })
    return result

@router.get("/tree")
def get_syllabus_tree(session: Session = Depends(get_session)):
    subjects = session.exec(select(Subject).order_by(Subject.display_order)).all()
    chapters = session.exec(select(Chapter).order_by(Chapter.display_order)).all()
    topics = session.exec(select(Topic).order_by(Topic.display_order)).all()
    
    tree = []
    for s in subjects:
        s_chapters = [c for c in chapters if c.subject_id == s.id]
        chap_list = []
        for c in s_chapters:
            c_topics = [t for t in topics if t.chapter_id == c.id]
            chap_list.append({
                "id": c.id,
                "title": c.title,
                "display_order": c.display_order,
                "topics": c_topics
            })
        tree.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "icon": s.icon,
            "color": s.color,
            "exam_weightage": s.exam_weightage,
            "baseline_level": s.baseline_level,
            "chapters": chap_list
        })
    return tree

@router.get("/topics/{topic_id}")
def get_topic_detail(topic_id: int, session: Session = Depends(get_session)):
    topic = session.exec(select(Topic).where(Topic.id == topic_id)).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    subject = session.exec(select(Subject).where(Subject.id == topic.subject_id)).first()
    chapter = session.exec(select(Chapter).where(Chapter.id == topic.chapter_id)).first()
    
    # Linked mistakes
    mistakes = session.exec(select(MistakeLog).where(MistakeLog.topic_id == topic_id)).all()
    
    # Linked journal entries
    journals = session.exec(select(JournalEntry).where(JournalEntry.topic_id == topic_id)).all()
    
    # Revision history
    revisions = session.exec(
        select(RevisionRecord)
        .where(RevisionRecord.topic_id == topic_id)
        .order_by(RevisionRecord.revision_date.desc())
    ).all()
    
    return {
        "topic": topic,
        "subject": subject,
        "chapter": chapter,
        "mistakes": mistakes,
        "journals": journals,
        "revisions": revisions
    }

@router.put("/topics/{topic_id}")
def update_topic(topic_id: int, payload: dict, session: Session = Depends(get_session)):
    topic = session.exec(select(Topic).where(Topic.id == topic_id)).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
        
    # If subtopics updated, recalculate completion_percentage
    if "subtopics" in payload:
        subtopics = payload["subtopics"]
        topic.subtopics_json = json.dumps(subtopics)
        total_st = len(subtopics)
        completed_st = sum(1 for st in subtopics if st.get("completed"))
        if total_st > 0:
            topic.completion_percentage = round((completed_st / total_st * 100.0), 1)
            if completed_st == total_st and topic.status == "Not Started":
                topic.status = "Completed"
            elif completed_st > 0 and topic.status == "Not Started":
                topic.status = "In Progress"
                
    for field in ["status", "priority", "difficulty", "pyqs_solved", "actual_hours", "confidence", "mastery_confirmed"]:
        if field in payload:
            setattr(topic, field, payload[field])
            
    session.add(topic)
    session.commit()
    session.refresh(topic)
    return topic

@router.post("/topics/{topic_id}/revise")
def revise_topic(
    topic_id: int,
    payload: dict,
    session: Session = Depends(get_session)
):
    confidence = payload.get("confidence", "Average")
    notes = payload.get("notes")
    topic, rev = record_topic_revision(session, topic_id, confidence, notes)
    return {"status": "success", "topic": topic, "revision": rev}

@router.get("/revisions")
def get_revision_matrix(session: Session = Depends(get_session)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    topics = session.exec(select(Topic)).all()
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    
    due_today = []
    overdue = []
    upcoming = []
    weak_topics = []
    recently_revised = []
    
    for t in topics:
        subj = subjects.get(t.subject_id)
        item = {
            "id": t.id,
            "title": t.title,
            "subject_name": subj.name if subj else "General",
            "subject_color": subj.color if subj else "#6366F1",
            "confidence": t.confidence,
            "revision_count": t.revision_count,
            "next_revision_date": t.next_revision_date,
            "last_revised_date": t.last_revised_date,
            "status": t.status
        }
        
        if t.status == "Needs Revision" or t.confidence == "Weak":
            weak_topics.append(item)
            
        if t.next_revision_date:
            if t.next_revision_date == today_str:
                due_today.append(item)
            elif t.next_revision_date < today_str:
                overdue.append(item)
            else:
                upcoming.append(item)
                
        if t.last_revised_date:
            recently_revised.append(item)
            
    recently_revised.sort(key=lambda x: x["last_revised_date"] or "", reverse=True)
    upcoming.sort(key=lambda x: x["next_revision_date"] or "")
    overdue.sort(key=lambda x: x["next_revision_date"] or "")
    
    return {
        "due_today": due_today,
        "overdue": overdue,
        "upcoming": upcoming[:15],
        "weak_topics": weak_topics,
        "recently_revised": recently_revised[:10]
    }
