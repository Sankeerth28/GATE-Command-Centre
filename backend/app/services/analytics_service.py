from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlmodel import Session, select
from app.models.models import (
    Topic, Subject, StudySession, WorkItem, MockTest, MockSubjectResult,
    MistakeLog, UserSettings
)

def get_dashboard_kpis(session: Session) -> Dict[str, Any]:
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    target_daily_hours = settings.daily_target_hours if settings else 4.0
    
    # 1. Topics and Syllabus Progress
    topics = session.exec(select(Topic)).all()
    total_topics = len(topics)
    completed_topics = sum(1 for t in topics if t.status in ["Completed", "Mastered"])
    mastered_topics = sum(1 for t in topics if t.status == "Mastered")
    needs_revision_topics = sum(1 for t in topics if t.status == "Needs Revision")
    in_progress_topics = sum(1 for t in topics if t.status == "In Progress")
    not_started_topics = sum(1 for t in topics if t.status == "Not Started")
    
    total_estimated_hours = sum(t.estimated_hours for t in topics)
    total_actual_hours = sum(t.actual_hours for t in topics)
    
    # Formula from PRD: Sum of (Topic completion ratio * Topic estimated hours) / Total estimated syllabus hours * 100
    weighted_progress_sum = sum((t.completion_percentage / 100.0) * t.estimated_hours for t in topics)
    weighted_syllabus_completion_pct = round((weighted_progress_sum / total_estimated_hours * 100.0), 2) if total_estimated_hours > 0 else 0.0
    
    # 2. Actual Study Sessions Duration
    sessions = session.exec(select(StudySession)).all()
    total_study_seconds = sum(s.duration_seconds for s in sessions)
    total_actual_study_hours = round(total_study_seconds / 3600.0, 2)
    
    # 3. Last 7 Days Actual Study Hours & Rolling Average
    today_dt = datetime.now(timezone.utc)
    seven_days_ago_dt = today_dt - timedelta(days=7)
    seven_days_ago_str = seven_days_ago_dt.strftime("%Y-%m-%d")
    
    recent_sessions = session.exec(
        select(StudySession)
        .where(StudySession.start_timestamp >= seven_days_ago_str)
    ).all()
    recent_seconds = sum(s.duration_seconds for s in recent_sessions)
    recent_7d_hours = round(recent_seconds / 3600.0, 2)
    seven_day_avg_daily_hours = round(recent_7d_hours / 7.0, 2)
    
    # 4. Planned vs Actual Hours
    all_work_items = session.exec(select(WorkItem)).all()
    total_planned_minutes = sum(w.estimated_duration_minutes for w in all_work_items)
    total_planned_hours = round(total_planned_minutes / 60.0, 2)
    
    # 5. Effective days until Exam (2027-02-06)
    exam_dt = datetime(2027, 2, 6, 9, 30, tzinfo=timezone.utc)
    days_remaining = max(1, (exam_dt - today_dt).days)
    hours_remaining = max(1, int((exam_dt - today_dt).total_seconds() // 3600))
    
    # Run-rate needed: remaining estimated hours / effective days
    remaining_hours = max(0.0, total_estimated_hours - total_actual_study_hours)
    required_daily_runrate_hours = round(remaining_hours / days_remaining, 2) if days_remaining > 0 else 0.0
    
    # 6. Current Streak calculation (consecutive days with study sessions)
    session_dates = {
        s.start_timestamp[:10]
        for s in sessions if s.start_timestamp
    }
    
    streak = 0
    check_day = today_dt
    # If no session today yet, check yesterday to keep yesterday's active streak
    today_str = today_dt.strftime("%Y-%m-%d")
    if today_str not in session_dates:
        check_day = today_dt - timedelta(days=1)
        
    while True:
        c_str = check_day.strftime("%Y-%m-%d")
        if c_str in session_dates:
            streak += 1
            check_day -= timedelta(days=1)
        else:
            break
            
    # 7. Unfinished / Overdue activities
    unfinished_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date < today_str)
        .where(WorkItem.status.in_(["Scheduled", "Deferred", "In Progress"]))
    ).all()
    
    # 8. Actionable Intelligence Observations based strictly on data
    observations = []
    if needs_revision_topics > 0:
        observations.append(f"You have {needs_revision_topics} topic(s) flagged for revision or with unresolved mistakes.")
    if len(unfinished_items) > 0:
        observations.append(f"You have {len(unfinished_items)} unfinished backlog activity(ies) from previous days.")
    if total_actual_study_hours > 0 and seven_day_avg_daily_hours < target_daily_hours:
        observations.append(f"Your 7-day average ({seven_day_avg_daily_hours}h/day) is below your target run-rate ({target_daily_hours}h/day).")
    if total_actual_study_hours == 0:
        observations.append("Fresh preparation baseline detected. Start your first focus block from Today's Execution Queue!")
        
    return {
        "countdown": {
            "exam_name": settings.exam_name if settings else "GATE 2027 DA",
            "exam_timestamp": settings.exam_date if settings else "2027-02-06T09:30:00+05:30",
            "days_remaining": days_remaining,
            "hours_remaining": hours_remaining,
            "today_date": today_str
        },
        "kpis": {
            "weighted_syllabus_completion_pct": weighted_syllabus_completion_pct,
            "total_topics": total_topics,
            "completed_topics": completed_topics,
            "mastered_topics": mastered_topics,
            "needs_revision_topics": needs_revision_topics,
            "in_progress_topics": in_progress_topics,
            "not_started_topics": not_started_topics,
            "total_actual_study_hours": total_actual_study_hours,
            "total_planned_hours": total_planned_hours,
            "seven_day_avg_daily_hours": seven_day_avg_daily_hours,
            "required_daily_runrate_hours": required_daily_runrate_hours,
            "target_daily_hours": target_daily_hours,
            "current_streak_days": streak,
            "unfinished_count": len(unfinished_items)
        },
        "observations": observations
    }

def get_comprehensive_analytics(session: Session) -> Dict[str, Any]:
    subjects = session.exec(select(Subject).order_by(Subject.display_order)).all()
    topics = session.exec(select(Topic)).all()
    sessions = session.exec(select(StudySession)).all()
    mock_tests = session.exec(select(MockTest).order_by(MockTest.test_date)).all()
    mock_subject_results = session.exec(select(MockSubjectResult)).all()
    mistakes = session.exec(select(MistakeLog)).all()
    
    # 1. Subject-wise Progress & Study Hours
    subject_analytics = []
    for s in subjects:
        s_topics = [t for t in topics if t.subject_id == s.id]
        s_est_hours = sum(t.estimated_hours for t in s_topics)
        s_actual_hours = sum(t.actual_hours for t in s_topics)
        s_completed = sum(1 for t in s_topics if t.status in ["Completed", "Mastered"])
        
        # Calculate subject weighted completion
        s_weighted_sum = sum((t.completion_percentage / 100.0) * t.estimated_hours for t in s_topics)
        s_progress_pct = round((s_weighted_sum / s_est_hours * 100.0), 1) if s_est_hours > 0 else 0.0
        
        # Mock test performance in this subject
        s_mock_results = [m for m in mock_subject_results if m.subject_id == s.id]
        total_mock_obtained = sum(m.marks_obtained for m in s_mock_results)
        total_mock_questions = sum(m.total_questions for m in s_mock_results)
        
        subject_analytics.append({
            "id": s.id,
            "code": s.code,
            "name": s.name,
            "color": s.color,
            "exam_weightage": s.exam_weightage,
            "baseline_level": s.baseline_level,
            "total_topics": len(s_topics),
            "completed_topics": s_completed,
            "estimated_hours": s_est_hours,
            "actual_hours": round(s_actual_hours, 1),
            "progress_pct": s_progress_pct,
            "mock_tests_taken": len(s_mock_results),
            "mock_marks_obtained": round(total_mock_obtained, 2),
            "has_sufficient_mock_data": len(s_mock_results) >= 2
        })
        
    # 2. Daily Study Hours for Past 14 Days
    today_dt = datetime.now(timezone.utc)
    daily_history = []
    for d in range(13, -1, -1):
        day_date = (today_dt - timedelta(days=d)).strftime("%Y-%m-%d")
        day_sessions = [s for s in sessions if s.start_timestamp.startswith(day_date)]
        day_hours = round(sum(s.duration_seconds for s in day_sessions) / 3600.0, 2)
        daily_history.append({
            "date": day_date,
            "hours": day_hours
        })
        
    # 3. Mistake Analysis by Error Category
    error_category_counts = {
        "Conceptual Gap": 0,
        "Formula or Theorem Forgetting": 0,
        "Calculation or Algebra Error": 0,
        "Question Misinterpretation": 0,
        "Time Pressure or Guessing": 0
    }
    for m in mistakes:
        if m.error_category in error_category_counts:
            error_category_counts[m.error_category] += 1
            
    mistake_distribution = [
        {"category": cat, "count": count}
        for cat, count in error_category_counts.items()
    ]
    
    # 4. Mock Score Progression
    mock_history = [
        {
            "id": m.id,
            "title": m.title,
            "date": m.test_date,
            "net_score": m.marks_obtained,
            "gross_score": m.gross_positive_marks,
            "negative_marks": m.negative_marks_lost,
            "accuracy_pct": m.accuracy_pct,
            "attempt_rate_pct": m.attempt_rate_pct
        }
        for m in mock_tests
    ]
    
    return {
        "subject_analytics": subject_analytics,
        "daily_history": daily_history,
        "mistake_distribution": mistake_distribution,
        "mock_history": mock_history,
        "total_mistakes": len(mistakes),
        "unresolved_mistakes": sum(1 for m in mistakes if not m.is_resolved)
    }
