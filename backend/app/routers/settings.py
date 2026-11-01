from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import UserSettings
from datetime import datetime, timezone

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("/")
def get_user_settings(session: Session = Depends(get_session)):
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    return settings

@router.put("/")
def update_user_settings(payload: dict, session: Session = Depends(get_session)):
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    if not settings:
        settings = UserSettings(id=1)
        
    for k, v in payload.items():
        if hasattr(settings, k) and k != "id":
            setattr(settings, k, v)
            
    settings.updated_at_utc = datetime.now(timezone.utc).isoformat()
    session.add(settings)
    session.commit()
    session.refresh(settings)
    return settings
