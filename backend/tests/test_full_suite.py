import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from app.main import app
from app.core.database import get_session
from app.core.config import settings

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "GATE 2027" in data["exam"]

def test_user_settings():
    # 1. GET settings
    response = client.get("/api/settings/")
    assert response.status_code == 200
    data = response.json()
    assert data["daily_target_hours"] > 0
    assert "GATE 2027" in data["exam_name"]

    # 2. PUT settings
    update_res = client.put("/api/settings/", json={"daily_target_hours": 5.0})
    assert update_res.status_code == 200
    assert update_res.json()["daily_target_hours"] == 5.0

def test_syllabus_endpoints():
    # 1. Subjects list
    res = client.get("/api/syllabus/subjects")
    assert res.status_code == 200
    subjects = res.json()
    assert len(subjects) == 7
    codes = [s["code"] for s in subjects]
    assert "PROB_STAT" in codes
    assert "ML_AI" in codes
    assert "GEN_APT" in codes

    # 2. Tree
    tree_res = client.get("/api/syllabus/tree")
    assert tree_res.status_code == 200
    tree = tree_res.json()
    assert len(tree) == 7
    assert len(tree[0]["chapters"]) > 0

    # 3. Topic detail
    first_topic_id = tree[0]["chapters"][0]["topics"][0]["id"]
    detail_res = client.get(f"/api/syllabus/topics/{first_topic_id}")
    assert detail_res.status_code == 200
    topic_data = detail_res.json()
    assert "topic" in topic_data
    assert "subject" in topic_data
    assert "chapter" in topic_data

    # 4. Revise topic
    rev_res = client.post(f"/api/syllabus/topics/{first_topic_id}/revise", json={
        "confidence": "Strong",
        "notes": "Reviewed probability axioms and Bayes rule"
    })
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "success"

    # 5. Revisions matrix
    matrix_res = client.get("/api/syllabus/revisions")
    assert matrix_res.status_code == 200
    matrix = matrix_res.json()
    assert "due_today" in matrix
    assert "upcoming" in matrix
    assert "weak_topics" in matrix

def test_planner_endpoints():
    # 1. Today's queue
    today_res = client.get("/api/planner/today")
    assert today_res.status_code == 200
    today_data = today_res.json()
    assert "items" in today_data
    assert "date" in today_data

    # 2. Backlog
    backlog_res = client.get("/api/planner/backlog")
    assert backlog_res.status_code == 200
    assert isinstance(backlog_res.json(), list)

    # 3. Create work item
    item_res = client.post("/api/planner/items", json={
        "title": "Practice Eigenvalues & SVD NAT problems",
        "session_type": "Mathematical Practice",
        "scheduled_date": "2026-11-02",
        "estimated_duration_minutes": 60,
        "priority": "High"
    })
    assert item_res.status_code == 200
    item = item_res.json()
    assert item["title"] == "Practice Eigenvalues & SVD NAT problems"
    item_id = item["id"]

    # 4. Defer item
    defer_res = client.post(f"/api/planner/items/{item_id}/defer", json={"target_date": "2026-11-03"})
    assert defer_res.status_code == 200
    assert defer_res.json()["scheduled_date"] == "2026-11-03"
    assert defer_res.json()["defer_count"] == 1

    # 5. Update item status to Completed
    update_res = client.put(f"/api/planner/items/{item_id}", json={"status": "Completed"})
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"
    assert update_res.json()["completion_timestamp"] is not None

def test_study_sessions_and_timer_integration():
    # 1. Log study session
    sess_res = client.post("/api/sessions/", json={
        "session_type": "Concept Learning",
        "duration_seconds": 1500, # 25 min Pomodoro
        "mode": "Pomodoro",
        "questions_practiced": 5,
        "confidence_rating": "Good"
    })
    assert sess_res.status_code == 200
    session_data = sess_res.json()
    assert session_data["duration_seconds"] == 1500

    # 2. Get sessions list
    list_res = client.get("/api/sessions/?limit=5")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

def test_intelligent_interactions():
    # 1. Morning checkin context
    m_ctx_res = client.get("/api/interactions/morning-checkin?date=2026-11-02")
    assert m_ctx_res.status_code == 200
    ctx = m_ctx_res.json()
    assert "interaction_date" in ctx

    # 2. Submit morning checkin
    m_sub_res = client.post("/api/interactions/morning-checkin", json={
        "interaction_date": "2026-11-02",
        "answers": {
            "yesterday_completion": "all",
            "today_availability": "full",
            "workload_adjustment": "normal"
        }
    })
    assert m_sub_res.status_code == 200
    assert m_sub_res.json()["status"] == "success"

    # 3. Evening review context
    e_ctx_res = client.get("/api/interactions/evening-review?date=2026-11-02")
    assert e_ctx_res.status_code == 200

    # 4. Submit evening review
    e_sub_res = client.post("/api/interactions/evening-review", json={
        "interaction_date": "2026-11-02",
        "answers": {
            "overall_satisfaction": "Strong",
            "unlogged_hours": 0.5,
            "reflow_missed": True
        }
    })
    assert e_sub_res.status_code == 200
    assert e_sub_res.json()["status"] == "success"

    # 5. Task completion modal feedback
    tc_res = client.post("/api/interactions/task-completion", json={
        "confidence_rating": "Strong",
        "practiced_questions": True,
        "questions_count": 8
    })
    assert tc_res.status_code == 200
    assert tc_res.json()["status"] == "success"

def test_mock_test_scoring_and_mistake_vault():
    # 1. Create a mock test with GATE DA marking scheme
    # 1-mark MCQ: correct (+1)
    # 2-mark MCQ: incorrect (-0.6666...)
    # 2-mark MSQ: correct (+2)
    # 1-mark NAT: incorrect (0 penalty)
    mock_payload = {
        "title": "Comprehensive Mock Test DA 01",
        "provider": "Made Easy",
        "test_type": "Full-Length Mock",
        "test_date": "2026-11-01",
        "time_taken_minutes": 175,
        "questions": [
            {
                "subject_id": 1,
                "question_type": "1-mark MCQ",
                "user_status": "correct",
                "question_text": "Sample Probability MCQ 1"
            },
            {
                "subject_id": 1,
                "question_type": "2-mark MCQ",
                "user_status": "incorrect",
                "question_text": "Conditional Expectation & Variance",
                "error_category": "Conceptual Gap",
                "solution_notes": "Forgot law of total variance: Var(X) = E[Var(X|Y)] + Var(E[X|Y])",
                "your_answer": "B",
                "correct_answer": "D"
            },
            {
                "subject_id": 2,
                "question_type": "2-mark MSQ",
                "user_status": "correct",
                "question_text": "Properties of positive definite matrices"
            },
            {
                "subject_id": 2,
                "question_type": "1-mark NAT",
                "user_status": "incorrect",
                "question_text": "Calculate trace of inverse matrix",
                "error_category": "Calculation or Algebra Error",
                "your_answer": "4.5",
                "correct_answer": "5.0"
            }
        ]
    }

    mock_res = client.post("/api/mocks/", json=mock_payload)
    assert mock_res.status_code == 200
    created_mock = mock_res.json()
    assert created_mock["questions_attempted"] == 4
    assert created_mock["correct_count"] == 2
    assert created_mock["incorrect_count"] == 2
    # Gross positive: 1 + 2 = 3
    assert created_mock["gross_positive_marks"] == 3.0
    # Negative penalty: 2-mark MCQ gives ~0.67, NAT gives 0.0 penalty
    assert round(created_mock["negative_marks_lost"], 2) == 0.67
    assert round(created_mock["marks_obtained"], 2) == 2.33

    mock_id = created_mock["id"]

    # 2. Verify Mock Detail with subject breakdown
    detail_res = client.get(f"/api/mocks/{mock_id}")
    assert detail_res.status_code == 200
    mock_detail = detail_res.json()
    assert len(mock_detail["subject_breakdown"]) == 2

    # 3. Verify Mistake Vault has the 2 logged mistakes
    mistakes_res = client.get("/api/mistakes/")
    assert mistakes_res.status_code == 200
    mistakes = mistakes_res.json()
    assert len(mistakes) >= 2
    conceptual = [m for m in mistakes if m["error_category"] == "Conceptual Gap"]
    assert len(conceptual) >= 1
    mistake_id = conceptual[0]["id"]

    # 4. Resolve a mistake
    resolve_res = client.put(f"/api/mistakes/{mistake_id}/resolve", json={"is_resolved": True})
    assert resolve_res.status_code == 200
    assert resolve_res.json()["is_resolved"] is True
    assert resolve_res.json()["resolved_at_utc"] is not None

def test_journal_endpoints():
    # 1. Create entry
    res = client.post("/api/journal/", json={
        "title": "Linear Algebra Orthogonality & QR Decomposition",
        "entry_type": "Formula Sheet",
        "content": "Gram-Schmidt orthonormalization: $q_k = v_k - \\sum \\langle v_k, q_i \\rangle q_i$",
        "tags": ["Math", "LinearAlgebra", "Formulas"],
        "is_pinned": True
    })
    assert res.status_code == 200
    entry = res.json()
    assert entry["title"] == "Linear Algebra Orthogonality & QR Decomposition"
    assert entry["is_pinned"] is True
    entry_id = entry["id"]

    # 2. Get entries
    list_res = client.get("/api/journal/?entry_type=Formula Sheet")
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # 3. Update entry
    upd_res = client.put(f"/api/journal/{entry_id}", json={
        "title": "Linear Algebra Orthogonality & QR Decomposition (Updated)"
    })
    assert upd_res.status_code == 200
    assert upd_res.json()["title"] == "Linear Algebra Orthogonality & QR Decomposition (Updated)"

    # 4. Delete entry
    del_res = client.delete(f"/api/journal/{entry_id}")
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "success"

def test_analytics_endpoints():
    # 1. Dashboard KPIs
    dash_res = client.get("/api/analytics/dashboard")
    assert dash_res.status_code == 200
    data = dash_res.json()
    assert "countdown" in data
    assert "kpis" in data
    assert "observations" in data
    assert data["countdown"]["days_remaining"] > 0
    assert data["countdown"]["hours_remaining"] > 0
    assert "weighted_syllabus_completion_pct" in data["kpis"]
    assert "seven_day_avg_daily_hours" in data["kpis"]
    assert data["kpis"]["total_topics"] == 51

    # 2. Comprehensive Analytics
    comp_res = client.get("/api/analytics/comprehensive")
    assert comp_res.status_code == 200
    comp = comp_res.json()
    assert "subject_analytics" in comp
    assert "mistake_distribution" in comp
    assert "mock_history" in comp
    assert len(comp["subject_analytics"]) == 7

def test_data_export_and_backup():
    # Export
    exp_res = client.get("/api/data/export")
    assert exp_res.status_code == 200
    backup = exp_res.json()
    assert backup["version"] == "3.0.0"
    assert "subjects" in backup
    assert "topics" in backup
    assert "work_items" in backup
    assert len(backup["subjects"]) == 7
