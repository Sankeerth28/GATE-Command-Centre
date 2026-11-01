import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    
    PROJECT_NAME: str = "GATE Command Centre"
    VERSION: str = "3.0.0"
    API_V1_STR: str = "/api"
    
    # Path configuration
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = DATA_DIR / "gate_command_centre.db"
    
    # Target Exam Constants
    EXAM_NAME: str = "GATE 2027 — Data Science and Artificial Intelligence (DA)"
    DEFAULT_EXAM_TIMESTAMP_IST: str = "2027-02-06T09:30:00+05:30"
    DEFAULT_SYLLABUS_TARGET_DATE: str = "2027-01-15"
    TIMEZONE: str = "Asia/Kolkata"

settings = Settings()

# Ensure data directory exists
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
