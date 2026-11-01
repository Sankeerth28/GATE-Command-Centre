from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.responses import FileResponse
from sqlmodel import Session
from app.core.database import get_session
from app.core.config import settings
from app.services.data_service import (
    export_full_database_json, import_full_database_json, reset_preparation_progress
)

router = APIRouter(prefix="/data", tags=["Data Management"])

@router.get("/export")
def export_data(session: Session = Depends(get_session)):
    return export_full_database_json(session)

@router.post("/import")
def import_data(payload: dict, session: Session = Depends(get_session)):
    return import_full_database_json(session, payload)

@router.post("/reset")
def reset_data(session: Session = Depends(get_session)):
    return reset_preparation_progress(session)

@router.get("/download-db")
def download_database_file():
    if not settings.DB_PATH.exists():
        raise HTTPException(status_code=404, detail="Database file not found")
    return FileResponse(
        path=settings.DB_PATH,
        filename="gate_command_centre.db",
        media_type="application/octet-stream"
    )
