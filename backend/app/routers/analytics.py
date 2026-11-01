from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.core.database import get_session
from app.services.analytics_service import get_dashboard_kpis, get_comprehensive_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics & Intelligence"])

@router.get("/dashboard")
def dashboard_analytics(session: Session = Depends(get_session)):
    return get_dashboard_kpis(session)

@router.get("/comprehensive")
def comprehensive_analytics(session: Session = Depends(get_session)):
    return get_comprehensive_analytics(session)
