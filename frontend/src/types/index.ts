export interface UserSettings {
  id: number;
  exam_name: string;
  exam_date: string;
  timezone: string;
  prep_start_date?: string;
  daily_target_hours: number;
  weekly_target_hours: number;
  max_daily_capacity_hours: number;
  syllabus_target_date: string;
  mock_target_count?: number;
  pomodoro_focus_minutes: number;
  pomodoro_short_break: number;
  pomodoro_long_break: number;
  deepwork_focus_minutes: number;
  deepwork_break_minutes: number;
  morning_checkin_time: string;
  evening_review_time: string;
  baseline_confirmed: boolean;
  baselines_json: string;
  subject_allocations_json?: string;
  weekly_schedule_json?: string;
  phases_json?: string;
  created_at_utc: string;
  updated_at_utc: string;
}

export interface Subject {
  id: number;
  code: string;
  name: string;
  icon: string;
  color: string;
  exam_weightage: number;
  baseline_level: string;
  display_order: number;
  topic_count?: number;
  completed_count?: number;
  estimated_hours?: number;
  actual_hours?: number;
  completion_percentage?: number;
}

export interface SubtopicItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface Topic {
  id: number;
  chapter_id: number;
  subject_id: number;
  title: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Needs Revision' | 'Mastered';
  priority: 'High' | 'Medium' | 'Low';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimated_hours: number;
  actual_hours: number;
  completion_percentage: number;
  subtopics_json: string;
  pyqs_solved: number;
  pyqs_target: number;
  confidence?: 'Weak' | 'Average' | 'Good' | 'Strong' | null;
  last_studied_date?: string | null;
  last_revised_date?: string | null;
  revision_count: number;
  next_revision_date?: string | null;
  mastery_confirmed: boolean;
  display_order: number;
}

export interface Chapter {
  id: number;
  subject_id: number;
  title: string;
  display_order: number;
  topics: Topic[];
}

export interface SubjectTreeItem extends Subject {
  chapters: Chapter[];
}

export interface WorkItem {
  id: string;
  title: string;
  subject_id?: number | null;
  topic_id?: number | null;
  session_type:
    | 'Concept Learning'
    | 'Mathematical Derivation'
    | 'Solved Examples'
    | 'PYQ Practice'
    | 'Spaced Revision'
    | 'Sectional Test'
    | 'Mock Test'
    | 'Mock Analysis'
    | 'Mathematical Practice';
  scheduled_date: string;
  start_time?: string | null;
  end_time?: string | null;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Deferred' | 'Cancelled';
  defer_count: number;
  completion_timestamp?: string | null;
  notes?: string | null;
  created_at_utc?: string;
  subject_name?: string | null;
  subject_color?: string | null;
  topic_title?: string | null;
}

export interface StudySession {
  id: string;
  work_item_id?: string | null;
  topic_id?: number | null;
  subject_id?: number | null;
  session_type: string;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  mode: 'Pomodoro' | 'Deep Work' | 'Open Stopwatch';
  questions_practiced: number;
  confidence_rating?: string | null;
  created_at_utc?: string;
  subject_name?: string | null;
  subject_color?: string | null;
  topic_title?: string | null;
}

export interface RevisionRecord {
  id: string;
  topic_id: number;
  revision_date: string;
  interval_days: number;
  confidence_rating: string;
  previous_next_date?: string | null;
  calculated_next_date: string;
  notes?: string | null;
  created_at_utc: string;
}

export interface RevisionMatrixItem {
  id: number;
  title: string;
  subject_name: string;
  subject_color: string;
  confidence?: string | null;
  revision_count: number;
  next_revision_date?: string | null;
  last_revised_date?: string | null;
  status: string;
}

export interface RevisionMatrixResponse {
  due_today: RevisionMatrixItem[];
  overdue: RevisionMatrixItem[];
  upcoming: RevisionMatrixItem[];
  weak_topics: RevisionMatrixItem[];
  recently_revised: RevisionMatrixItem[];
}

export interface MockTest {
  id: string;
  title: string;
  provider: string;
  test_type: 'Full-Length Mock' | 'Subject Test' | 'Topic Test' | 'Previous Year Paper';
  test_date: string;
  time_taken_minutes: number;
  total_marks: number;
  marks_obtained: number;
  gross_positive_marks: number;
  negative_marks_lost: number;
  questions_attempted: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  accuracy_pct: number;
  attempt_rate_pct: number;
  rank?: number | null;
  percentile?: number | null;
  notes?: string | null;
  created_at_utc: string;
}

export interface MockSubjectResult {
  id: string;
  mock_test_id: string;
  subject_id: number;
  total_questions: number;
  attempted: number;
  correct: number;
  incorrect: number;
  marks_obtained: number;
  negative_marks: number;
  subject_name?: string;
  subject_color?: string;
}

export interface MistakeLog {
  id: string;
  mock_test_id?: string | null;
  subject_id: number;
  topic_id?: number | null;
  question_text: string;
  question_type: '1-mark MCQ' | '2-mark MCQ' | '1-mark MSQ' | '2-mark MSQ' | '1-mark NAT' | '2-mark NAT';
  marks: number;
  error_category: 'Conceptual Gap' | 'Formula or Theorem Forgetting' | 'Calculation or Algebra Error' | 'Question Misinterpretation' | 'Time Pressure or Guessing';
  your_answer?: string | null;
  correct_answer?: string | null;
  solution_notes?: string | null;
  image_url?: string | null;
  is_resolved: boolean;
  resolved_at_utc?: string | null;
  created_at_utc: string;
  subject_name?: string | null;
  subject_color?: string | null;
  topic_title?: string | null;
}

export interface JournalEntry {
  id: string;
  title: string;
  entry_type: 'Daily Reflection' | 'Formula Sheet' | 'Concept Note';
  content: string;
  subject_id?: number | null;
  topic_id?: number | null;
  tags_json: string;
  is_pinned: boolean;
  created_at_utc: string;
  updated_at_utc: string;
  subject_name?: string | null;
  subject_color?: string | null;
  topic_title?: string | null;
}

export interface DashboardKPIs {
  countdown: {
    exam_name: string;
    exam_timestamp: string;
    days_remaining: number;
    hours_remaining: number;
    today_date: string;
    prep_start_date?: string;
    syllabus_target_date?: string;
    days_to_syllabus_deadline?: number;
    current_phase?: {
      id: number;
      name: string;
      start_date: string;
      end_date: string;
      objectives: string[];
    } | null;
    next_milestone?: string;
  };
  kpis: {
    weighted_syllabus_completion_pct: number;
    total_topics: number;
    completed_topics: number;
    mastered_topics: number;
    needs_revision_topics: number;
    in_progress_topics: number;
    not_started_topics: number;
    total_actual_study_hours: number;
    total_planned_hours: number;
    seven_day_avg_daily_hours: number;
    weekly_actual_hours?: number;
    weekly_target_hours?: number;
    remaining_estimated_hours?: number;
    required_daily_runrate_hours: number;
    required_weekly_runrate_hours?: number;
    target_daily_hours: number;
    current_streak_days: number;
    unfinished_count: number;
    overdue_srs_count?: number;
    pending_pyqs_count?: number;
    unresolved_mistakes_count?: number;
    latest_mock_score?: number | null;
    is_behind_schedule?: boolean;
    deficit_warning?: string | null;
  };
  observations: string[];
}

export interface ComprehensiveAnalytics {
  subject_analytics: Array<{
    id: number;
    code: string;
    name: string;
    color: string;
    exam_weightage: number;
    baseline_level: string;
    total_topics: number;
    completed_topics: number;
    estimated_hours: number;
    actual_hours: number;
    progress_pct: number;
    mock_tests_taken: number;
    mock_marks_obtained: number;
    has_sufficient_mock_data: boolean;
  }>;
  daily_history: Array<{
    date: string;
    hours: number;
  }>;
  mistake_distribution: Array<{
    category: string;
    count: number;
  }>;
  mock_history: Array<{
    id: string;
    title: string;
    date: string;
    net_score: number;
    gross_score: number;
    negative_marks: number;
    accuracy_pct: number;
    attempt_rate_pct: number;
  }>;
  total_mistakes: number;
  unresolved_mistakes: number;
}
