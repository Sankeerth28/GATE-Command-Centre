import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import WorkItem, Topic, Subject, AutomationEvent
from app.services.planner_service import generate_study_plan, reflow_backlog

router = APIRouter(prefix="/planner", tags=["Planner"])

@router.get("/items")
def get_work_items(
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    query = select(WorkItem)
    if date:
        query = query.where(WorkItem.scheduled_date == date)
    if start_date:
        query = query.where(WorkItem.scheduled_date >= start_date)
    if end_date:
        query = query.where(WorkItem.scheduled_date <= end_date)
    if status:
        query = query.where(WorkItem.status == status)
        
    items = session.exec(query.order_by(WorkItem.scheduled_date, WorkItem.priority.desc())).all()
    
    # Enrich with subject and topic names
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    topics = {t.id: t for t in session.exec(select(Topic)).all()}
    
    enriched = []
    for item in items:
        subj = subjects.get(item.subject_id)
        top = topics.get(item.topic_id)
        enriched.append({
            **item.model_dump(),
            "subject_name": subj.name if subj else None,
            "subject_color": subj.color if subj else "#6366F1",
            "topic_title": top.title if top else None
        })
    return enriched

@router.get("/today")
def get_today_queue(
    date: Optional[str] = Query(None),
    session: Session = Depends(get_session)
):
    today_str = date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Get today's work items
    today_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date == today_str)
        .order_by(WorkItem.priority.desc())
    ).all()
    
    # Get overdue items
    overdue_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date < today_str)
        .where(WorkItem.status.in_(["Scheduled", "In Progress", "Deferred"]))
    ).all()
    
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    topics = {t.id: t for t in session.exec(select(Topic)).all()}
    
    def enrich(items):
        res = []
        for i in items:
            subj = subjects.get(i.subject_id)
            top = topics.get(i.topic_id)
            res.append({
                **i.model_dump(),
                "subject_name": subj.name if subj else None,
                "subject_color": subj.color if subj else "#6366F1",
                "topic_title": top.title if top else None
            })
        return res
        
    enriched_today = enrich(today_items)
    next_activity = next((i for i in enriched_today if i["status"] in ["Scheduled", "In Progress"]), None)
    
    return {
        "date": today_str,
        "items": enriched_today,
        "next_activity": next_activity,
        "overdue_count": len(overdue_items),
        "overdue_items": enrich(overdue_items[:5])
    }

@router.get("/backlog")
def get_backlog(session: Session = Depends(get_session)):
    today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    items = session.exec(
        select(WorkItem)
        .where(
            (WorkItem.scheduled_date < today_str) | (WorkItem.status == "Deferred")
        )
        .where(WorkItem.status.in_(["Scheduled", "Deferred", "In Progress"]))
        .order_by(WorkItem.scheduled_date.desc())
    ).all()
    
    subjects = {s.id: s for s in session.exec(select(Subject)).all()}
    topics = {t.id: t for t in session.exec(select(Topic)).all()}
    
    return [
        {
            **item.model_dump(),
            "subject_name": subjects.get(item.subject_id).name if item.subject_id in subjects else None,
            "subject_color": subjects.get(item.subject_id).color if item.subject_id in subjects else "#6366F1",
            "topic_title": topics.get(item.topic_id).title if item.topic_id in topics else None
        }
        for item in items
    ]

@router.post("/items")
def create_work_item(payload: dict, session: Session = Depends(get_session)):
    item = WorkItem(
        id=str(uuid.uuid4()),
        title=payload["title"],
        subject_id=payload.get("subject_id"),
        topic_id=payload.get("topic_id"),
        session_type=payload.get("session_type", "Concept Learning"),
        scheduled_date=payload.get("scheduled_date", datetime.now(timezone.utc).strftime("%Y-%m-%d")),
        start_time=payload.get("start_time"),
        end_time=payload.get("end_time"),
        estimated_duration_minutes=payload.get("estimated_duration_minutes", 60),
        priority=payload.get("priority", "Medium"),
        status=payload.get("status", "Scheduled"),
        notes=payload.get("notes")
    )
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.put("/items/{item_id}")
def update_work_item(item_id: str, payload: dict, session: Session = Depends(get_session)):
    item = session.exec(select(WorkItem).where(WorkItem.id == item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="WorkItem not found")
        
    for k, v in payload.items():
        if hasattr(item, k) and k != "id":
            setattr(item, k, v)
            
    if payload.get("status") == "Completed" and not item.completion_timestamp:
        item.completion_timestamp = datetime.now(timezone.utc).isoformat()
        
    session.add(item)
    session.commit()
    session.refresh(item)
    return item

@router.post("/items/{item_id}/defer")
def defer_work_item(item_id: str, payload: Optional[dict] = None, session: Session = Depends(get_session)):
    item = session.exec(select(WorkItem).where(WorkItem.id == item_id)).first()
    if not item:
        raise HTTPException(status_code=404, detail="WorkItem not found")
        
    target_date = payload.get("target_date") if payload else None
    if not target_date:
        curr_dt = datetime.strptime(item.scheduled_date, "%Y-%m-%d")
        target_date = (curr_dt + timedelta(days=1)).strftime("%Y-%m-%d")
        
    prev_date = item.scheduled_date
    item.scheduled_date = target_date
    item.defer_count += 1
    item.status = "Deferred"
    session.add(item)
    
    # Audit event
    auto_event = AutomationEvent(
        event_type="item_deferred",
        entity_type="work_item",
        entity_id=item.id,
        previous_state_json=f'{{"date": "{prev_date}"}}',
        new_state_json=f'{{"date": "{target_date}", "defer_count": {item.defer_count}}}',
        trigger_reason=f"User deferred task {item.title} to {target_date}",
        reversible=True
    )
    session.add(auto_event)
    session.commit()
    session.refresh(item)
    return item

@router.post("/generate-plan")
def generate_plan_api(payload: Optional[dict] = None, session: Session = Depends(get_session)):
    start_date = payload.get("start_date") if payload else None
    target_date = payload.get("target_date") if payload else None
    result = generate_study_plan(session, start_date=start_date, target_date=target_date)
    return result

@router.post("/reflow-backlog")
def reflow_backlog_api(payload: Optional[dict] = None, session: Session = Depends(get_session)):
    target_start_date = payload.get("target_start_date") if payload else None
    result = reflow_backlog(session, target_start_date=target_start_date)
    return result
