import json
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlmodel import SQLModel, Field, Relationship

def now_utc_str() -> str:
    return datetime.now(timezone.utc).isoformat()

DEFAULT_SUBJECT_ALLOCATIONS_JSON = json.dumps({
    "PROB_STAT": 6.0,
    "LIN_ALG": 6.0,
    "CALC_OPT": 4.5,
    "PROG_DSA": 6.0,
    "DBMS_DWH": 5.0,
    "ML_AI": 7.0,
    "GEN_APT": 4.5
})

DEFAULT_WEEKLY_SCHEDULE_JSON = json.dumps({
    "Monday": [
        {"subject_code": "PROB_STAT", "hours": 2.0},
        {"subject_code": "LIN_ALG", "hours": 2.0},
        {"subject_code": "PROG_DSA", "hours": 2.0}
    ],
    "Tuesday": [
        {"subject_code": "PROB_STAT", "hours": 2.0},
        {"subject_code": "CALC_OPT", "hours": 2.0},
        {"subject_code": "DBMS_DWH", "hours": 2.0}
    ],
    "Wednesday": [
        {"subject_code": "LIN_ALG", "hours": 2.0},
        {"subject_code": "ML_AI", "hours": 2.0},
        {"subject_code": "GEN_APT", "hours": 1.0},
        {"subject_code": "DBMS_DWH", "hours": 1.0}
    ],
    "Thursday": [
        {"subject_code": "CALC_OPT", "hours": 2.0},
        {"subject_code": "PROG_DSA", "hours": 2.0},
        {"subject_code": "ML_AI", "hours": 2.0}
    ],
    "Friday": [
        {"subject_code": "PROB_STAT", "hours": 2.0},
        {"subject_code": "DBMS_DWH", "hours": 2.0},
        {"subject_code": "LIN_ALG", "hours": 1.0},
        {"subject_code": "GEN_APT", "hours": 1.0}
    ],
    "Saturday": [
        {"subject_code": "ML_AI", "hours": 2.0},
        {"subject_code": "PROG_DSA", "hours": 2.0},
        {"subject_code": "CALC_OPT", "hours": 0.5},
        {"subject_code": "GEN_APT", "hours": 1.5}
    ],
    "Sunday": [
        {"subject_code": "LIN_ALG", "hours": 1.0},
        {"subject_code": "ML_AI", "hours": 1.0},
        {"subject_code": "GEN_APT", "hours": 1.0}
    ]
})

DEFAULT_PHASES_JSON = json.dumps([
    {
        "id": 1,
        "name": "Phase 1: Foundation Rebuilding",
        "start_date": "2026-11-02",
        "end_date": "2026-11-15",
        "objectives": [
            "Rebuild Linear Algebra from fundamentals (Vector Spaces, Matrices, Elementary Row Ops)",
            "Begin Probability and Statistics (Counting, Axioms, Conditional Prob)",
            "Begin Calculus and Optimization (Limits, Continuity, Differentiation)",
            "Continue Programming and DSA (Python OOP, Lists, Stacks, Queues)",
            "Maintain regular DBMS and ML exposure"
        ]
    },
    {
        "id": 2,
        "name": "Phase 2: Core Subject Coverage",
        "start_date": "2026-11-16",
        "end_date": "2026-12-13",
        "objectives": [
            "Complete most Linear Algebra topics (Transformations, Eigenvalues, Orthogonality, SVD)",
            "Progress through Probability distributions and statistical inference",
            "Cover multivariable Calculus and Optimization (Gradients, Hessian, Constraints)",
            "Cover DSA trees, heaps, graphs and algorithms",
            "Cover relational algebra, SQL, normalization and transactions",
            "Cover supervised Machine Learning and SVM",
            "Maintain PYQ practice alongside concept learning"
        ]
    },
    {
        "id": 3,
        "name": "Phase 3: Remaining Syllabus Completion",
        "start_date": "2026-12-14",
        "end_date": "2026-12-27",
        "objectives": [
            "Deep Learning and Neural Networks (MLP, Backprop, Optimizers)",
            "Dimensionality Reduction (PCA) and Clustering (k-Means, DBSCAN)",
            "AI Search Algorithms (A*, Heuristics) and Adversarial Search (Minimax, Alpha-Beta)",
            "Remaining DBMS, Probability, and Calculus topics",
            "Remaining DSA topics (Sorting, Graphs)",
            "Topic-wise PYQs and sectional tests",
            "Target: Complete first learning pass of all 51 topics by December 27"
        ]
    },
    {
        "id": 4,
        "name": "Phase 4: Consolidation and Backlog Closure",
        "start_date": "2026-12-28",
        "end_date": "2027-01-15",
        "objectives": [
            "Finish incomplete topics and backlog closure",
            "Complete pending PYQs across all subjects",
            "Revise mathematical derivations and proofs",
            "Resolve all open Mistake Vault entries",
            "Conduct timed sectional tests",
            "Consolidate formula sheets and study journals",
            "January 15: Hard syllabus closure deadline"
        ]
    },
    {
        "id": 5,
        "name": "Final Examination Preparation",
        "start_date": "2027-01-16",
        "end_date": "2027-02-05",
        "objectives": [
            "Full-length GATE DA mock examinations (Min: 10, Stretch: 15)",
            "Detailed 3-hour mock analysis after every test",
            "Systematic revision of all 7 subjects",
            "Formula and derivation speed-recall",
            "Weak-topic remediation without new syllabus learning",
            "Time management, question selection & negative mark minimization",
            "February 6, 2027: GATE DA Examination"
        ]
    }
])

# 1. User Settings
class UserSettings(SQLModel, table=True):
    __tablename__ = "user_settings"
    
    id: Optional[int] = Field(default=1, primary_key=True)
    exam_name: str = Field(default="GATE 2027 — Data Science and Artificial Intelligence (DA)")
    exam_date: str = Field(default="2027-02-06T09:30:00+05:30")
    timezone: str = Field(default="Asia/Kolkata")
    prep_start_date: str = Field(default="2026-11-02")
    daily_target_hours: float = Field(default=6.0)
    weekly_target_hours: float = Field(default=39.0)
    max_daily_capacity_hours: float = Field(default=8.0)
    syllabus_target_date: str = Field(default="2027-01-15")
    mock_target_count: int = Field(default=10)
    pomodoro_focus_minutes: int = Field(default=25)
    pomodoro_short_break: int = Field(default=5)
    pomodoro_long_break: int = Field(default=15)
    deepwork_focus_minutes: int = Field(default=50)
    deepwork_break_minutes: int = Field(default=10)
    morning_checkin_time: str = Field(default="07:30")
    evening_review_time: str = Field(default="21:30")
    baseline_confirmed: bool = Field(default=False)
    baselines_json: str = Field(default="{}")
    subject_allocations_json: str = Field(default=DEFAULT_SUBJECT_ALLOCATIONS_JSON)
    weekly_schedule_json: str = Field(default=DEFAULT_WEEKLY_SCHEDULE_JSON)
    phases_json: str = Field(default=DEFAULT_PHASES_JSON)
    created_at_utc: str = Field(default_factory=now_utc_str)
    updated_at_utc: str = Field(default_factory=now_utc_str)

# 2. Subjects
class Subject(SQLModel, table=True):
    __tablename__ = "subjects"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(unique=True, index=True)
    name: str = Field(index=True)
    icon: str = Field(default="BookOpen")
    color: str = Field(default="#6366F1")
    exam_weightage: float = Field(default=14.0)
    baseline_level: str = Field(default="Intermediate")
    display_order: int = Field(default=1)

# 3. Chapters
class Chapter(SQLModel, table=True):
    __tablename__ = "chapters"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subject_id: int = Field(foreign_key="subjects.id", index=True)
    title: str = Field(index=True)
    display_order: int = Field(default=1)

# 4. Topics
class Topic(SQLModel, table=True):
    __tablename__ = "topics"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    chapter_id: int = Field(foreign_key="chapters.id", index=True)
    subject_id: int = Field(foreign_key="subjects.id", index=True)
    title: str = Field(index=True)
    status: str = Field(default="Not Started", index=True)  # Not Started, In Progress, Completed, Needs Revision, Mastered
    priority: str = Field(default="Medium")                 # High, Medium, Low
    difficulty: str = Field(default="Medium")               # Easy, Medium, Hard
    estimated_hours: float = Field(default=6.0)
    actual_hours: float = Field(default=0.0)
    completion_percentage: float = Field(default=0.0)
    subtopics_json: str = Field(default="[]")              # JSON array of { id, title, completed }
    pyqs_solved: int = Field(default=0)
    pyqs_target: int = Field(default=20)
    confidence: Optional[str] = Field(default=None)        # Weak, Average, Good, Strong
    last_studied_date: Optional[str] = Field(default=None)
    last_revised_date: Optional[str] = Field(default=None)
    revision_count: int = Field(default=0)
    next_revision_date: Optional[str] = Field(default=None, index=True)
    mastery_confirmed: bool = Field(default=False)
    display_order: int = Field(default=1)

# 5. Work Items (Unified Planner Architecture)
class WorkItem(SQLModel, table=True):
    __tablename__ = "work_items"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str = Field(index=True)
    subject_id: Optional[int] = Field(default=None, foreign_key="subjects.id", index=True)
    topic_id: Optional[int] = Field(default=None, foreign_key="topics.id", index=True)
    session_type: str = Field(default="Concept Learning") # Concept Learning, Mathematical Practice, PYQ Practice, Spaced Revision, Mock Test, Mock Analysis
    scheduled_date: str = Field(index=True) # YYYY-MM-DD
    start_time: Optional[str] = Field(default=None)
    end_time: Optional[str] = Field(default=None)
    estimated_duration_minutes: int = Field(default=60)
    actual_duration_minutes: int = Field(default=0)
    priority: str = Field(default="Medium") # High, Medium, Low
    status: str = Field(default="Scheduled", index=True) # Scheduled, In Progress, Completed, Deferred, Cancelled
    defer_count: int = Field(default=0)
    completion_timestamp: Optional[str] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    created_at_utc: str = Field(default_factory=now_utc_str)

# 6. Study Sessions
class StudySession(SQLModel, table=True):
    __tablename__ = "study_sessions"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    work_item_id: Optional[str] = Field(default=None, foreign_key="work_items.id", index=True)
    topic_id: Optional[int] = Field(default=None, foreign_key="topics.id", index=True)
    subject_id: Optional[int] = Field(default=None, foreign_key="subjects.id", index=True)
    session_type: str = Field(default="Concept Learning")
    start_timestamp: str = Field(index=True) # ISO format
    end_timestamp: str = Field(index=True)   # ISO format
    duration_seconds: int = Field(default=0)
    mode: str = Field(default="Pomodoro")    # Pomodoro, Deep Work, Open Stopwatch
    questions_practiced: int = Field(default=0)
    confidence_rating: Optional[str] = Field(default=None) # Weak, Average, Good, Strong
    created_at_utc: str = Field(default_factory=now_utc_str)

# 7. Revision Records
class RevisionRecord(SQLModel, table=True):
    __tablename__ = "revision_records"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    topic_id: int = Field(foreign_key="topics.id", index=True)
    revision_date: str = Field(index=True) # YYYY-MM-DD
    interval_days: int = Field(default=1)
    confidence_rating: str = Field(default="Average")
    previous_next_date: Optional[str] = Field(default=None)
    calculated_next_date: str = Field(index=True)
    notes: Optional[str] = Field(default=None)
    created_at_utc: str = Field(default_factory=now_utc_str)

# 8. Mock Tests
class MockTest(SQLModel, table=True):
    __tablename__ = "mock_tests"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str = Field(index=True)
    provider: str = Field(default="Self-Administered")
    test_type: str = Field(default="Full-Length Mock") # Full-Length Mock, Subject Test, Topic Test, Previous Year Paper
    test_date: str = Field(index=True) # YYYY-MM-DD
    time_taken_minutes: int = Field(default=180)
    total_marks: float = Field(default=100.0)
    marks_obtained: float = Field(default=0.0)
    gross_positive_marks: float = Field(default=0.0)
    negative_marks_lost: float = Field(default=0.0)
    questions_attempted: int = Field(default=0)
    correct_count: int = Field(default=0)
    incorrect_count: int = Field(default=0)
    unattempted_count: int = Field(default=0)
    accuracy_pct: float = Field(default=0.0)
    attempt_rate_pct: float = Field(default=0.0)
    rank: Optional[int] = Field(default=None)
    percentile: Optional[float] = Field(default=None)
    notes: Optional[str] = Field(default=None)
    created_at_utc: str = Field(default_factory=now_utc_str)

# 9. Mock Subject Results
class MockSubjectResult(SQLModel, table=True):
    __tablename__ = "mock_subject_results"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    mock_test_id: str = Field(foreign_key="mock_tests.id", index=True)
    subject_id: int = Field(foreign_key="subjects.id", index=True)
    total_questions: int = Field(default=0)
    attempted: int = Field(default=0)
    correct: int = Field(default=0)
    incorrect: int = Field(default=0)
    marks_obtained: float = Field(default=0.0)
    negative_marks: float = Field(default=0.0)

# 10. Mistake Logs (Mistake Vault)
class MistakeLog(SQLModel, table=True):
    __tablename__ = "mistake_logs"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    mock_test_id: Optional[str] = Field(default=None, foreign_key="mock_tests.id", index=True)
    subject_id: int = Field(foreign_key="subjects.id", index=True)
    topic_id: Optional[int] = Field(default=None, foreign_key="topics.id", index=True)
    question_text: str
    question_type: str = Field(default="1-mark MCQ") # 1-mark MCQ, 2-mark MCQ, 1-mark MSQ, 2-mark MSQ, 1-mark NAT, 2-mark NAT
    marks: float = Field(default=1.0)
    error_category: str = Field(default="Conceptual Gap") # Conceptual Gap, Formula or Theorem Forgetting, Calculation or Algebra Error, Question Misinterpretation, Time Pressure or Guessing
    your_answer: Optional[str] = Field(default=None)
    correct_answer: Optional[str] = Field(default=None)
    solution_notes: Optional[str] = Field(default=None)
    image_url: Optional[str] = Field(default=None)
    is_resolved: bool = Field(default=False, index=True)
    resolved_at_utc: Optional[str] = Field(default=None)
    created_at_utc: str = Field(default_factory=now_utc_str)

# 11. Journal Entries
class JournalEntry(SQLModel, table=True):
    __tablename__ = "journal_entries"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    title: str = Field(index=True)
    entry_type: str = Field(default="Daily Reflection") # Daily Reflection, Formula Sheet, Concept Note
    content: str = Field(default="")
    subject_id: Optional[int] = Field(default=None, foreign_key="subjects.id", index=True)
    topic_id: Optional[int] = Field(default=None, foreign_key="topics.id", index=True)
    tags_json: str = Field(default="[]")
    is_pinned: bool = Field(default=False, index=True)
    created_at_utc: str = Field(default_factory=now_utc_str)
    updated_at_utc: str = Field(default_factory=now_utc_str)

# 12. Interaction Records (Intelligent Interaction Engine)
class InteractionRecord(SQLModel, table=True):
    __tablename__ = "interaction_records"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    interaction_type: str = Field(index=True) # morning_checkin, evening_review, task_completion, weekly_review, onboarding_baseline
    interaction_date: str = Field(index=True) # YYYY-MM-DD
    current_question: str
    selected_answer: str
    metadata_json: Optional[str] = Field(default="{}")
    related_work_item_id: Optional[str] = Field(default=None, foreign_key="work_items.id")
    status: str = Field(default="completed", index=True)
    created_at_utc: str = Field(default_factory=now_utc_str)
    completed_at_utc: Optional[str] = Field(default=None)

# 13. Automation Events (Audit & Traceability)
class AutomationEvent(SQLModel, table=True):
    __tablename__ = "automation_events"
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    event_type: str = Field(index=True) # plan_generated, auto_rescheduled, backlog_reflowed, revision_flagged, topic_confidence_updated
    entity_type: str = Field(index=True) # work_item, topic, revision_record
    entity_id: str = Field(index=True)
    previous_state_json: Optional[str] = Field(default=None)
    new_state_json: Optional[str] = Field(default=None)
    trigger_reason: str
    created_at_utc: str = Field(default_factory=now_utc_str)
    reversible: bool = Field(default=True)
    reverted_at_utc: Optional[str] = Field(default=None)
