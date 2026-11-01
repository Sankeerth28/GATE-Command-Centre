from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import SQLModel, Session, create_engine
from app.core.config import settings

DATABASE_URL = f"sqlite:///{settings.DB_PATH.as_posix()}"

engine = create_engine(
    DATABASE_URL,
    echo=False,
    connect_args={"check_same_thread": False}
)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL;")
    cursor.execute("PRAGMA foreign_keys=ON;")
    cursor.execute("PRAGMA synchronous=NORMAL;")
    cursor.close()

def get_session():
    with Session(engine) as session:
        yield session

def migrate_db():
    """
    Safely adds any missing columns and updates default 39h schedule on user_settings.
    Preserves all existing user records and SQLite integrity.
    """
    from app.models.models import (
        DEFAULT_SUBJECT_ALLOCATIONS_JSON,
        DEFAULT_WEEKLY_SCHEDULE_JSON,
        DEFAULT_PHASES_JSON
    )
    with engine.connect() as conn:
        cursor = conn.exec_driver_sql("PRAGMA table_info(user_settings)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        
        new_cols = {
            "prep_start_date": "TEXT DEFAULT '2026-11-02'",
            "mock_target_count": "INTEGER DEFAULT 10",
            "subject_allocations_json": f"TEXT DEFAULT '{DEFAULT_SUBJECT_ALLOCATIONS_JSON}'",
            "weekly_schedule_json": f"TEXT DEFAULT '{DEFAULT_WEEKLY_SCHEDULE_JSON}'",
            "phases_json": f"TEXT DEFAULT '{DEFAULT_PHASES_JSON}'"
        }
        
        for col_name, col_def in new_cols.items():
            if col_name not in existing_cols:
                conn.exec_driver_sql(f"ALTER TABLE user_settings ADD COLUMN {col_name} {col_def}")
                
        # Upgrade existing settings row to 39h weekly / 6h daily if still on legacy 28h default
        conn.exec_driver_sql(f"""
            UPDATE user_settings
            SET daily_target_hours = 6.0,
                weekly_target_hours = 39.0,
                prep_start_date = '2026-11-02',
                mock_target_count = 10,
                subject_allocations_json = CASE 
                    WHEN subject_allocations_json IS NULL OR subject_allocations_json = '{{}}' 
                    THEN '{DEFAULT_SUBJECT_ALLOCATIONS_JSON}' 
                    ELSE subject_allocations_json 
                END,
                weekly_schedule_json = CASE 
                    WHEN weekly_schedule_json IS NULL OR weekly_schedule_json = '{{}}' 
                    THEN '{DEFAULT_WEEKLY_SCHEDULE_JSON}' 
                    ELSE weekly_schedule_json 
                END,
                phases_json = CASE 
                    WHEN phases_json IS NULL OR phases_json = '[]' 
                    THEN '{DEFAULT_PHASES_JSON}' 
                    ELSE phases_json 
                END
            WHERE id = 1 AND weekly_target_hours = 28.0;
        """)
        conn.commit()

def init_db():
    SQLModel.metadata.create_all(engine)
    migrate_db()
