import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from sqlmodel import Session, select
from app.models.models import (
    Topic, Subject, StudySession, WorkItem, MockTest, MockSubjectResult,
    MistakeLog, UserSettings, DEFAULT_PHASES_JSON
)

KOLKATA_OFFSET = timedelta(hours=5, minutes=30)

def now_kolkata() -> datetime:
    return datetime.now(timezone.utc) + KOLKATA_OFFSET

def get_dashboard_kpis(session: Session) -> Dict[str, Any]:
    settings = session.exec(select(UserSettings).where(UserSettings.id == 1)).first()
    target_daily_hours = settings.daily_target_hours if settings else 6.0
    weekly_target_hours = settings.weekly_target_hours if settings else 39.0
    syllabus_target_date_str = settings.syllabus_target_date if settings else "2027-01-15"
    phases = json.loads(settings.phases_json) if settings and settings.phases_json else json.loads(DEFAULT_PHASES_JSON)
    
    today_dt = now_kolkata()
    today_str = today_dt.strftime("%Y-%m-%d")
    
    # 1. Topics and Syllabus Progress (Strictly based on actual subtopics/topic completion)
    topics = session.exec(select(Topic)).all()
    total_topics = len(topics)
    completed_topics = sum(1 for t in topics if t.status in ["Completed", "Mastered"])
    mastered_topics = sum(1 for t in topics if t.status == "Mastered")
    needs_revision_topics = sum(1 for t in topics if t.status == "Needs Revision")
    in_progress_topics = sum(1 for t in topics if t.status == "In Progress")
    not_started_topics = sum(1 for t in topics if t.status == "Not Started")
    
    total_estimated_hours = sum(t.estimated_hours for t in topics)
    total_actual_hours = sum(t.actual_hours for t in topics)
    
    # Mathematical progress strictly from actual subtopic completion ratios
    weighted_progress_sum = sum((t.completion_percentage / 100.0) * t.estimated_hours for t in topics)
    weighted_syllabus_completion_pct = round((weighted_progress_sum / total_estimated_hours * 100.0), 2) if total_estimated_hours > 0 else 0.0
    
    # Remaining uncompleted syllabus hours
    remaining_estimated_hours = round(max(0.0, sum(t.estimated_hours * (1.0 - (t.completion_percentage / 100.0)) for t in topics)), 1)
    
    # 2. Actual Study Sessions Duration
    sessions = session.exec(select(StudySession)).all()
    total_study_seconds = sum(s.duration_seconds for s in sessions)
    total_actual_study_hours = round(total_study_seconds / 3600.0, 2)
    
    # 3. Weekly Actual (current week Monday to Sunday) & 7-Day Rolling Average
    current_weekday = today_dt.weekday() # 0 is Monday
    start_of_week_dt = today_dt - timedelta(days=current_weekday)
    start_of_week_str = start_of_week_dt.strftime("%Y-%m-%d")
    
    week_sessions = [s for s in sessions if s.start_timestamp >= start_of_week_str]
    weekly_actual_hours = round(sum(s.duration_seconds for s in week_sessions) / 3600.0, 2)
    
    seven_days_ago_dt = today_dt - timedelta(days=7)
    seven_days_ago_str = seven_days_ago_dt.strftime("%Y-%m-%d")
    recent_sessions = [s for s in sessions if s.start_timestamp >= seven_days_ago_str]
    recent_seconds = sum(s.duration_seconds for s in recent_sessions)
    seven_day_avg_daily_hours = round(recent_seconds / 3600.0 / 7.0, 2)
    
    # 4. Planned vs Actual Hours
    all_work_items = session.exec(select(WorkItem)).all()
    total_planned_minutes = sum(w.estimated_duration_minutes for w in all_work_items)
    total_planned_hours = round(total_planned_minutes / 60.0, 2)
    
    # 5. Effective Countdown Dates
    exam_dt = datetime(2027, 2, 6, 9, 30, tzinfo=timezone.utc)
    days_to_exam = max(1, (exam_dt.date() - today_dt.date()).days)
    hours_to_exam = max(1, int((exam_dt - today_dt.replace(tzinfo=timezone.utc)).total_seconds() // 3600))
    
    syllabus_target_dt = datetime.strptime(syllabus_target_date_str, "%Y-%m-%d")
    days_to_syllabus_deadline = max(0, (syllabus_target_dt.date() - today_dt.date()).days)
    remaining_weeks = max(0.1, days_to_syllabus_deadline / 7.0)
    
    # Deadline Intelligence Run-Rates
    required_daily_runrate_hours = round(remaining_estimated_hours / max(1, days_to_syllabus_deadline), 2)
    required_weekly_runrate_hours = round(remaining_estimated_hours / remaining_weeks, 2)
    
    # 6. Current Phase & Next Milestone
    current_phase = None
    for p in phases:
        if p["start_date"] <= today_str <= p["end_date"]:
            current_phase = p
            break
    if not current_phase:
        if today_str < phases[0]["start_date"]:
            current_phase = phases[0]
        else:
            current_phase = phases[-1]
            
    next_milestone = f"{current_phase['name']} Deadline: {current_phase['end_date']}"
    
    # 7. Academic Readiness Indicators
    overdue_srs_topics = [t for t in topics if t.next_revision_date and t.next_revision_date < today_str]
    total_pyqs_target = sum(t.pyqs_target for t in topics)
    total_pyqs_solved = sum(t.pyqs_solved for t in topics)
    pending_pyqs_count = max(0, total_pyqs_target - total_pyqs_solved)
    
    mistakes = session.exec(select(MistakeLog)).all()
    unresolved_mistakes_count = sum(1 for m in mistakes if not m.is_resolved)
    
    latest_mock = session.exec(
        select(MockTest).order_by(MockTest.test_date.desc(), MockTest.created_at_utc.desc())
    ).first()
    latest_mock_score = latest_mock.marks_obtained if latest_mock else None
    
    # 8. Streak calculation
    session_dates = {s.start_timestamp[:10] for s in sessions if s.start_timestamp}
    streak = 0
    check_day = today_dt
    if today_str not in session_dates:
        check_day = today_dt - timedelta(days=1)
    while True:
        c_str = check_day.strftime("%Y-%m-%d")
        if c_str in session_dates:
            streak += 1
            check_day -= timedelta(days=1)
        else:
            break
            
    # 9. Backlog items
    unfinished_items = session.exec(
        select(WorkItem)
        .where(WorkItem.scheduled_date < today_str)
        .where(WorkItem.status.in_(["Scheduled", "Deferred", "In Progress"]))
    ).all()
    
    # 10. Deficit Warning & Deadline Intelligence
    is_behind_schedule = (
        (required_weekly_runrate_hours > weekly_target_hours + 3.0) or
        (seven_day_avg_daily_hours > 0 and seven_day_avg_daily_hours < target_daily_hours - 1.5) or
        (len(unfinished_items) >= 6)
    )
    
    deficit_warning = None
    if required_weekly_runrate_hours > weekly_target_hours:
        deficit_warning = (
            f"Pace Alert: To close all 51 topics by January 15 ({days_to_syllabus_deadline} days remaining), "
            f"your required weekly study pace is {required_weekly_runrate_hours}h/week, exceeding your 39h target. "
            f"Consider focusing on core high-weightage topics or utilizing the smart backlog reflow."
        )
        
    observations: List[str] = []
    if current_phase:
        observations.append(f"Current Milestone: {current_phase['name']} ({current_phase['start_date']} to {current_phase['end_date']}).")
    if len(overdue_srs_topics) > 0:
        observations.append(f"You have {len(overdue_srs_topics)} topic(s) overdue for spaced repetition revision.")
    if len(unfinished_items) > 0:
        observations.append(f"You have {len(unfinished_items)} incomplete backlog item(s) from previous study days.")
    if deficit_warning:
        observations.append(deficit_warning)
    elif seven_day_avg_daily_hours >= target_daily_hours:
        observations.append(f"Excellent momentum! Your 7-day average ({seven_day_avg_daily_hours}h/day) meets your target.")
        
    return {
        "countdown": {
            "exam_name": settings.exam_name if settings else "GATE 2027 DA",
            "exam_timestamp": settings.exam_date if settings else "2027-02-06T09:30:00+05:30",
            "days_remaining": days_to_exam,
            "hours_remaining": hours_to_exam,
            "today_date": today_str,
            "prep_start_date": settings.prep_start_date if settings else "2026-11-02",
            "syllabus_target_date": syllabus_target_date_str,
            "days_to_syllabus_deadline": days_to_syllabus_deadline,
            "current_phase": current_phase,
            "next_milestone": next_milestone
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
            "weekly_actual_hours": weekly_actual_hours,
            "weekly_target_hours": weekly_target_hours,
            "remaining_estimated_hours": remaining_estimated_hours,
            "required_daily_runrate_hours": required_daily_runrate_hours,
            "required_weekly_runrate_hours": required_weekly_runrate_hours,
            "target_daily_hours": target_daily_hours,
            "current_streak_days": streak,
            "unfinished_count": len(unfinished_items),
            "overdue_srs_count": len(overdue_srs_topics),
            "pending_pyqs_count": pending_pyqs_count,
            "unresolved_mistakes_count": unresolved_mistakes_count,
            "latest_mock_score": latest_mock_score,
            "is_behind_schedule": is_behind_schedule,
            "deficit_warning": deficit_warning
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
    today_dt = now_kolkata()
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
