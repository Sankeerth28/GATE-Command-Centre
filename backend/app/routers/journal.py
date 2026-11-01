import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import JournalEntry, Subject, Topic

router = APIRouter(prefix="/journal", tags=["Study & Formula Journal"])

@router.get("/")
def get_journal_entries(
    entry_type: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    topic_id: Optional[int] = Query(None),
    is_pinned: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(JournalEntry)
    if entry_type:
        query = query.where(JournalEntry.entry_type == entry_type)
    if subject_id:
        query = query.where(JournalEntry.subject_id == subject_id)
    if topic_id:
        query = query.where(JournalEntry.topic_id == topic_id)
    if is_pinned is not None:
        query = query.where(JournalEntry.is_pinned == is_pinned)
        
    items = session.exec(query.order_by(JournalEntry.is_pinned.desc(), JournalEntry.updated_at_utc.desc())).all()
    
    if search:
        search_lower = search.lower()
        items = [i for i in items if search_lower in i.title.lower() or search_lower in i.content.lower()]
        
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    topics = {t.id: t for t in session.exec(select(Topic)).all()}
    
    return [
        {
            **j.model_dump(),
            "subject_name": subjects.get(j.subject_id).name if j.subject_id in subjects else None,
            "subject_color": subjects.get(j.subject_id).color if j.subject_id in subjects else "#6366F1",
            "topic_title": topics.get(j.topic_id).title if j.topic_id in topics else None
        }
        for j in items
    ]

@router.post("/")
def create_journal_entry(payload: dict, session: Session = Depends(get_session)):
    entry = JournalEntry(
        id=str(uuid.uuid4()),
        title=payload.get("title", "Untitled Note"),
        entry_type=payload.get("entry_type", "Daily Reflection"),
        content=payload.get("content", ""),
        subject_id=payload.get("subject_id"),
        topic_id=payload.get("topic_id"),
        tags_json=json.dumps(payload.get("tags", [])),
        is_pinned=payload.get("is_pinned", False)
    )
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry

@router.put("/{entry_id}")
def update_journal_entry(entry_id: str, payload: dict, session: Session = Depends(get_session)):
    entry = session.exec(select(JournalEntry).where(JournalEntry.id == entry_id)).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
        
    for k in ["title", "entry_type", "content", "subject_id", "topic_id", "is_pinned"]:
        if k in payload:
            setattr(entry, k, payload[k])
            
    if "tags" in payload:
        entry.tags_json = json.dumps(payload["tags"])
        
    entry.updated_at_utc = datetime.now(timezone.utc).isoformat()
    session.add(entry)
    session.commit()
    session.refresh(entry)
    return entry

@router.delete("/{entry_id}")
def delete_journal_entry(entry_id: str, session: Session = Depends(get_session)):
    entry = session.exec(select(JournalEntry).where(JournalEntry.id == entry_id)).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    session.delete(entry)
    session.commit()
    return {"status": "success", "message": "Entry deleted"}
