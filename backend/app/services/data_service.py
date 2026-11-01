import json
from datetime import datetime, timezone
from typing import Dict, Any
from sqlmodel import Session, select, delete
from app.models.models import (
    UserSettings, Subject, Chapter, Topic, WorkItem, StudySession,
    RevisionRecord, MockTest, MockSubjectResult, MistakeLog,
    JournalEntry, InteractionRecord, AutomationEvent
)
from app.services.seed_data import seed_official_syllabus

def export_full_database_json(session: Session) -> Dict[str, Any]:
    return {
        "version": "3.0.0",
        "exported_at_utc": datetime.now(timezone.utc).isoformat(),
        "user_settings": [item.model_dump() for item in session.exec(select(UserSettings)).all()],
        "subjects": [item.model_dump() for item in session.exec(select(Subject)).all()],
        "chapters": [item.model_dump() for item in session.exec(select(Chapter)).all()],
        "topics": [item.model_dump() for item in session.exec(select(Topic)).all()],
        "work_items": [item.model_dump() for item in session.exec(select(WorkItem)).all()],
        "study_sessions": [item.model_dump() for item in session.exec(select(StudySession)).all()],
        "revision_records": [item.model_dump() for item in session.exec(select(RevisionRecord)).all()],
        "mock_tests": [item.model_dump() for item in session.exec(select(MockTest)).all()],
        "mock_subject_results": [item.model_dump() for item in session.exec(select(MockSubjectResult)).all()],
        "mistake_logs": [item.model_dump() for item in session.exec(select(MistakeLog)).all()],
        "journal_entries": [item.model_dump() for item in session.exec(select(JournalEntry)).all()],
        "interaction_records": [item.model_dump() for item in session.exec(select(InteractionRecord)).all()],
        "automation_events": [item.model_dump() for item in session.exec(select(AutomationEvent)).all()],
    }

def import_full_database_json(session: Session, data: Dict[str, Any]) -> Dict[str, Any]:
    if not isinstance(data, dict) or "version" not in data:
        raise ValueError("Invalid backup format. Missing 'version' header.")
        
    # Clear user activity data
    session.exec(delete(StudySession))
    session.exec(delete(RevisionRecord))
    session.exec(delete(MockSubjectResult))
    session.exec(delete(MockTest))
    session.exec(delete(MistakeLog))
    session.exec(delete(JournalEntry))
    session.exec(delete(InteractionRecord))
    session.exec(delete(AutomationEvent))
    session.exec(delete(WorkItem))
    session.commit()
    
    # Restore items if present
    for w_data in data.get("work_items", []):
        session.add(WorkItem(**w_data))
    for s_data in data.get("study_sessions", []):
        session.add(StudySession(**s_data))
    for r_data in data.get("revision_records", []):
        session.add(RevisionRecord(**r_data))
    for m_data in data.get("mock_tests", []):
        session.add(MockTest(**m_data))
    for ms_data in data.get("mock_subject_results", []):
        session.add(MockSubjectResult(**ms_data))
    for mis_data in data.get("mistake_logs", []):
        session.add(MistakeLog(**mis_data))
    for j_data in data.get("journal_entries", []):
        session.add(JournalEntry(**j_data))
    for i_data in data.get("interaction_records", []):
        session.add(InteractionRecord(**i_data))
        
    # Restore topics if present
    if "topics" in data:
        for t_data in data["topics"]:
            topic = session.exec(select(Topic).where(Topic.id == t_data.get("id"))).first()
            if topic:
                for k, v in t_data.items():
                    setattr(topic, k, v)
                session.add(topic)
                
    session.commit()
    return {"status": "success", "message": "Database successfully restored from JSON backup."}

def reset_preparation_progress(session: Session) -> Dict[str, Any]:
    """Resets user study activity while preserving official syllabus structure."""
    session.exec(delete(StudySession))
    session.exec(delete(RevisionRecord))
    session.exec(delete(MockSubjectResult))
    session.exec(delete(MockTest))
    session.exec(delete(MistakeLog))
    session.exec(delete(JournalEntry))
    session.exec(delete(InteractionRecord))
    session.exec(delete(AutomationEvent))
    session.exec(delete(WorkItem))
    
    # Reset topic progress to 0
    topics = session.exec(select(Topic)).all()
    for t in topics:
        t.status = "Not Started"
        t.actual_hours = 0.0
        t.completion_percentage = 0.0
        t.pyqs_solved = 0
        t.confidence = None
        t.last_studied_date = None
        t.last_revised_date = None
        t.revision_count = 0
        t.next_revision_date = None
        t.mastery_confirmed = False
        
        # Reset subtopics completed flags
        try:
            subtopics = json.loads(t.subtopics_json)
            for st in subtopics:
                st["completed"] = False
            t.subtopics_json = json.dumps(subtopics)
        except Exception:
            pass
        session.add(t)
        
    session.commit()
    return {"status": "success", "message": "Preparation progress safely reset. Official syllabus preserved."}
