import { SEED_SYLLABUS } from './seedSyllabus';
import type {
  UserSettings, Subject, SubjectTreeItem, Topic, WorkItem, StudySession,
  RevisionRecord, RevisionMatrixResponse, MockTest, MockSubjectResult,
  MistakeLog, JournalEntry, DashboardKPIs, ComprehensiveAnalytics
} from '../types';

const CONFIDENCE_INTERVALS: Record<string, number[]> = {
  Weak: [1],
  Average: [3],
  Good: [1, 3, 7, 14, 30],
  Strong: [21, 45, 90],
};

export const DEFAULT_SUBJECT_ALLOCATIONS_JSON = JSON.stringify({
  PROB_STAT: 6.0,
  LIN_ALG: 6.0,
  CALC_OPT: 4.5,
  PROG_DSA: 6.0,
  DBMS_DWH: 5.0,
  ML_AI: 7.0,
  GEN_APT: 4.5,
});

export const DEFAULT_WEEKLY_SCHEDULE_JSON = JSON.stringify({
  Monday: [
    { subject_code: 'PROB_STAT', hours: 2.0 },
    { subject_code: 'LIN_ALG', hours: 2.0 },
    { subject_code: 'PROG_DSA', hours: 2.0 },
  ],
  Tuesday: [
    { subject_code: 'PROB_STAT', hours: 2.0 },
    { subject_code: 'CALC_OPT', hours: 2.0 },
    { subject_code: 'DBMS_DWH', hours: 2.0 },
  ],
  Wednesday: [
    { subject_code: 'LIN_ALG', hours: 2.0 },
    { subject_code: 'ML_AI', hours: 2.0 },
    { subject_code: 'GEN_APT', hours: 1.0 },
    { subject_code: 'DBMS_DWH', hours: 1.0 },
  ],
  Thursday: [
    { subject_code: 'CALC_OPT', hours: 2.0 },
    { subject_code: 'PROG_DSA', hours: 2.0 },
    { subject_code: 'ML_AI', hours: 2.0 },
  ],
  Friday: [
    { subject_code: 'PROB_STAT', hours: 2.0 },
    { subject_code: 'DBMS_DWH', hours: 2.0 },
    { subject_code: 'LIN_ALG', hours: 1.0 },
    { subject_code: 'GEN_APT', hours: 1.0 },
  ],
  Saturday: [
    { subject_code: 'ML_AI', hours: 2.0 },
    { subject_code: 'PROG_DSA', hours: 2.0 },
    { subject_code: 'CALC_OPT', hours: 0.5 },
    { subject_code: 'GEN_APT', hours: 1.5 },
  ],
  Sunday: [
    { subject_code: 'LIN_ALG', hours: 1.0 },
    { subject_code: 'ML_AI', hours: 1.0 },
    { subject_code: 'GEN_APT', hours: 1.0 },
  ],
});

export const DEFAULT_PHASES_JSON = JSON.stringify([
  {
    id: 1,
    name: 'Phase 1: Foundation Rebuilding',
    start_date: '2026-11-02',
    end_date: '2026-11-15',
    objectives: [
      'Rebuild Linear Algebra from fundamentals (Vector Spaces, Matrices, Elementary Row Ops)',
      'Begin Probability and Statistics (Counting, Axioms, Conditional Prob)',
      'Begin Calculus and Optimization (Limits, Continuity, Differentiation)',
      'Continue Programming and DSA (Python OOP, Lists, Stacks, Queues)',
      'Maintain regular DBMS and ML exposure',
    ],
  },
  {
    id: 2,
    name: 'Phase 2: Core Subject Coverage',
    start_date: '2026-11-16',
    end_date: '2026-12-13',
    objectives: [
      'Complete most Linear Algebra topics (Transformations, Eigenvalues, Orthogonality, SVD)',
      'Progress through Probability distributions and statistical inference',
      'Cover multivariable Calculus and Optimization (Gradients, Hessian, Constraints)',
      'Cover DSA trees, heaps, graphs and algorithms',
      'Cover relational algebra, SQL, normalization and transactions',
      'Cover supervised Machine Learning and SVM',
      'Maintain PYQ practice alongside concept learning',
    ],
  },
  {
    id: 3,
    name: 'Phase 3: Remaining Syllabus Completion',
    start_date: '2026-12-14',
    end_date: '2026-12-27',
    objectives: [
      'Deep Learning and Neural Networks (MLP, Backprop, Optimizers)',
      'Dimensionality Reduction (PCA) and Clustering (k-Means, DBSCAN)',
      'AI Search Algorithms (A*, Heuristics) and Adversarial Search (Minimax, Alpha-Beta)',
      'Remaining DBMS, Probability, and Calculus topics',
      'Remaining DSA topics (Sorting, Graphs)',
      'Topic-wise PYQs and sectional tests',
      'Target: Complete first learning pass of all 51 topics by December 27',
    ],
  },
  {
    id: 4,
    name: 'Phase 4: Consolidation and Backlog Closure',
    start_date: '2026-12-28',
    end_date: '2027-01-15',
    objectives: [
      'Finish incomplete topics and backlog closure',
      'Complete pending PYQs across all subjects',
      'Revise mathematical derivations and proofs',
      'Resolve all open Mistake Vault entries',
      'Conduct timed sectional tests',
      'Consolidate formula sheets and study journals',
      'January 15: Hard syllabus closure deadline',
    ],
  },
  {
    id: 5,
    name: 'Final Examination Preparation',
    start_date: '2027-01-16',
    end_date: '2027-02-05',
    objectives: [
      'Full-length GATE DA mock examinations (Min: 10, Stretch: 15)',
      'Detailed 3-hour mock analysis after every test',
      'Systematic revision of all 7 subjects',
      'Formula and derivation speed-recall',
      'Weak-topic remediation without new syllabus learning',
      'Time management, question selection & negative mark minimization',
      'February 6, 2027: GATE DA Examination',
    ],
  },
]);

function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed', e);
  }
}

// Initialize default data if not present
function initializeLocalStore() {
  const existingSettings = getLocal<UserSettings | null>('gate_settings', null);
  if (existingSettings) {
    // Upgrade existing stored settings to 39h weekly / 6h daily if on legacy default
    let modified = false;
    if (existingSettings.weekly_target_hours === 28.0 || !existingSettings.weekly_schedule_json) {
      existingSettings.daily_target_hours = 6.0;
      existingSettings.weekly_target_hours = 39.0;
      existingSettings.prep_start_date = '2026-11-02';
      existingSettings.syllabus_target_date = '2027-01-15';
      existingSettings.mock_target_count = 10;
      existingSettings.subject_allocations_json = DEFAULT_SUBJECT_ALLOCATIONS_JSON;
      existingSettings.weekly_schedule_json = DEFAULT_WEEKLY_SCHEDULE_JSON;
      existingSettings.phases_json = DEFAULT_PHASES_JSON;
      modified = true;
    }
    if (modified) {
      setLocal('gate_settings', existingSettings);
    }
  }

  const initialized = localStorage.getItem('gate_initialized_v3');
  if (initialized && existingSettings) return;

  // 1. Settings
  const settings: UserSettings = {
    id: 1,
    exam_name: 'GATE 2027 — Data Science and Artificial Intelligence (DA)',
    exam_date: '2027-02-06T09:30:00+05:30',
    timezone: 'Asia/Kolkata',
    prep_start_date: '2026-11-02',
    daily_target_hours: 6.0,
    weekly_target_hours: 39.0,
    max_daily_capacity_hours: 8.0,
    syllabus_target_date: '2027-01-15',
    mock_target_count: 10,
    pomodoro_focus_minutes: 25,
    pomodoro_short_break: 5,
    pomodoro_long_break: 15,
    deepwork_focus_minutes: 50,
    deepwork_break_minutes: 10,
    morning_checkin_time: '07:30',
    evening_review_time: '21:30',
    baseline_confirmed: false,
    baselines_json: JSON.stringify({
      PROG_DSA: 'Intermediate',
      LIN_ALG: 'Intermediate',
      PROB_STAT: 'Weak',
      CALC_OPT: 'Weak',
      ML_AI: 'Intermediate',
      DBMS_DWH: 'Weak',
      GEN_APT: 'Intermediate',
    }),
    subject_allocations_json: DEFAULT_SUBJECT_ALLOCATIONS_JSON,
    weekly_schedule_json: DEFAULT_WEEKLY_SCHEDULE_JSON,
    phases_json: DEFAULT_PHASES_JSON,
    created_at_utc: new Date().toISOString(),
    updated_at_utc: new Date().toISOString(),
  };
  setLocal('gate_settings', settings);

  // 2. Subjects, Chapters, Topics
  const subjects: Subject[] = [];
  const chapters: Array<{ id: number; subject_id: number; title: string; display_order: number }> = [];
  const topics: Topic[] = [];

  let subjId = 1;
  let chapId = 1;
  let topId = 1;

  for (const s of SEED_SYLLABUS) {
    subjects.push({
      id: subjId,
      code: s.code,
      name: s.name,
      icon: s.icon,
      color: s.color,
      exam_weightage: s.exam_weightage,
      baseline_level: s.baseline_level,
      display_order: s.display_order,
    });

    for (const c of s.chapters) {
      chapters.push({
        id: chapId,
        subject_id: subjId,
        title: c.title,
        display_order: c.display_order,
      });

      for (let tIdx = 0; tIdx < c.topics.length; tIdx++) {
        const t = c.topics[tIdx];
        const subtopics = t.subtopics.map((stTitle: string, idx: number) => ({
          id: `st-${topId}-${idx + 1}`,
          title: stTitle,
          completed: false,
        }));

        topics.push({
          id: topId,
          chapter_id: chapId,
          subject_id: subjId,
          title: t.title,
          status: 'Not Started',
          priority: t.priority as any,
          difficulty: t.difficulty as any,
          estimated_hours: t.estimated_hours,
          actual_hours: 0,
          completion_percentage: 0,
          subtopics_json: JSON.stringify(subtopics),
          pyqs_solved: 0,
          pyqs_target: 20,
          confidence: null,
          last_studied_date: null,
          last_revised_date: null,
          revision_count: 0,
          next_revision_date: null,
          mastery_confirmed: false,
          display_order: tIdx + 1,
        });
        topId++;
      }
      chapId++;
    }
    subjId++;
  }

  setLocal('gate_subjects', subjects);
  setLocal('gate_chapters', chapters);
  setLocal('gate_topics', topics);

  // 3. Generate initial work items for today and next few days
  const todayStr = new Date().toISOString().split('T')[0];
  const initialWorkItems: WorkItem[] = [
    {
      id: 'wi-init-1',
      title: 'Axioms of Probability & Conditional Probability — Part 1 (Concept Learning)',
      subject_id: 1,
      topic_id: 2,
      session_type: 'Concept Learning',
      scheduled_date: todayStr,
      estimated_duration_minutes: 60,
      actual_duration_minutes: 0,
      priority: 'High',
      status: 'Scheduled',
      defer_count: 0,
      subject_name: 'Probability and Statistics',
      subject_color: '#6366F1',
      topic_title: 'Axioms of Probability & Conditional Probability',
    },
    {
      id: 'wi-init-2',
      title: 'Matrix Properties & Vector Spaces — Part 1 (Mathematical Practice)',
      subject_id: 2,
      topic_id: 7,
      session_type: 'Mathematical Practice',
      scheduled_date: todayStr,
      estimated_duration_minutes: 60,
      actual_duration_minutes: 0,
      priority: 'High',
      status: 'Scheduled',
      defer_count: 0,
      subject_name: 'Linear Algebra',
      subject_color: '#38BDF8',
      topic_title: 'Vector Spaces and Subspaces',
    },
    {
      id: 'wi-init-3',
      title: 'ER Modeling & Relational Schema Design (PYQ Practice)',
      subject_id: 5,
      topic_id: 25,
      session_type: 'PYQ Practice',
      scheduled_date: todayStr,
      estimated_duration_minutes: 60,
      actual_duration_minutes: 0,
      priority: 'Medium',
      status: 'Scheduled',
      defer_count: 0,
      subject_name: 'Database Management & Data Warehousing',
      subject_color: '#EC4899',
      topic_title: 'ER Model and Relational Model',
    },
  ];
  setLocal('gate_work_items', initialWorkItems);

  // 4. Default lists
  setLocal('gate_sessions', []);
  setLocal('gate_revisions', []);
  setLocal('gate_mocks', []);
  setLocal('gate_mock_results', []);
  setLocal('gate_mistakes', []);
  setLocal('gate_journal', [
    {
      id: 'j-init-1',
      title: 'GATE 2027 DA Mathematical Strategy & Key Identities',
      entry_type: 'Formula Sheet',
      content: `# Fundamental Theorems to Review\n\n- **Total Probability Theorem**: $P(A) = \\sum_i P(A|B_i) P(B_i)$\n- **Bayes Rule**: $P(B_k|A) = \\frac{P(A|B_k)P(B_k)}{\\sum_i P(A|B_i)P(B_i)}$\n- **Singular Value Decomposition (SVD)**: $A = U \\Sigma V^T$\n- **Positive Definiteness**: $x^T A x > 0$ for all $x \\neq 0$`,
      subject_id: 1,
      tags_json: JSON.stringify(['Math', 'Probability', 'LinearAlgebra']),
      is_pinned: true,
      created_at_utc: new Date().toISOString(),
      updated_at_utc: new Date().toISOString(),
      subject_name: 'Probability and Statistics',
      subject_color: '#6366F1',
    },
  ]);
  setLocal('gate_interactions', []);

  localStorage.setItem('gate_initialized_v3', 'true');
}

initializeLocalStore();

export const localStore = {
  // Settings
  getSettings: async (): Promise<UserSettings> => {
    initializeLocalStore();
    return getLocal<UserSettings>('gate_settings', {} as any);
  },
  updateSettings: async (payload: Partial<UserSettings>): Promise<UserSettings> => {
    const cur = getLocal<UserSettings>('gate_settings', {} as any);
    const updated = { ...cur, ...payload, updated_at_utc: new Date().toISOString() };
    setLocal('gate_settings', updated);
    return updated;
  },

  // Syllabus
  getSubjects: async (): Promise<Subject[]> => {
    initializeLocalStore();
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const topics = getLocal<Topic[]>('gate_topics', []);

    return subjects.map((s) => {
      const sTopics = topics.filter((t) => t.subject_id === s.id);
      const totalEst = sTopics.reduce((acc, t) => acc + t.estimated_hours, 0);
      const actualHours = sTopics.reduce((acc, t) => acc + t.actual_hours, 0);
      const completedCount = sTopics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length;
      const weightedSum = sTopics.reduce((acc, t) => acc + (t.completion_percentage / 100) * t.estimated_hours, 0);
      const compPct = totalEst > 0 ? Math.round((weightedSum / totalEst) * 1000) / 10 : 0;

      return {
        ...s,
        topic_count: sTopics.length,
        completed_count: completedCount,
        estimated_hours: totalEst,
        actual_hours: Math.round(actualHours * 10) / 10,
        completion_percentage: compPct,
      };
    });
  },

  getSyllabusTree: async (): Promise<SubjectTreeItem[]> => {
    initializeLocalStore();
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const chapters = getLocal<any[]>('gate_chapters', []);
    const topics = getLocal<Topic[]>('gate_topics', []);

    return subjects.map((s) => {
      const sChaps = chapters
        .filter((c) => c.subject_id === s.id)
        .map((c) => ({
          ...c,
          topics: topics.filter((t) => t.chapter_id === c.id),
        }));
      return {
        ...s,
        chapters: sChaps,
      };
    });
  },

  getTopicDetail: async (topicId: number) => {
    initializeLocalStore();
    const topics = getLocal<Topic[]>('gate_topics', []);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const chapters = getLocal<any[]>('gate_chapters', []);
    const mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);
    const journals = getLocal<JournalEntry[]>('gate_journal', []);
    const revisions = getLocal<RevisionRecord[]>('gate_revisions', []);

    const topic = topics.find((t) => t.id === topicId);
    if (!topic) throw new Error('Topic not found');

    const subject = subjects.find((s) => s.id === topic.subject_id);
    const chapter = chapters.find((c) => c.id === topic.chapter_id);

    return {
      topic,
      subject,
      chapter,
      mistakes: mistakes.filter((m) => m.topic_id === topicId),
      journals: journals.filter((j) => j.topic_id === topicId),
      revisions: revisions.filter((r) => r.topic_id === topicId),
    };
  },

  updateTopic: async (topicId: number, payload: Partial<Topic> & { subtopics?: any[] }): Promise<Topic> => {
    const topics = getLocal<Topic[]>('gate_topics', []);
    const idx = topics.findIndex((t) => t.id === topicId);
    if (idx === -1) throw new Error('Topic not found');

    const topic = { ...topics[idx] };

    if (payload.subtopics) {
      topic.subtopics_json = JSON.stringify(payload.subtopics);
      const total = payload.subtopics.length;
      const completed = payload.subtopics.filter((st) => st.completed).length;
      topic.completion_percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;
      if (completed === total && topic.status === 'Not Started') {
        topic.status = 'Completed';
      } else if (completed > 0 && topic.status === 'Not Started') {
        topic.status = 'In Progress';
      }
    }

    const allowed = ['status', 'priority', 'difficulty', 'pyqs_solved', 'actual_hours', 'confidence', 'mastery_confirmed'];
    for (const k of allowed) {
      if ((payload as any)[k] !== undefined) {
        (topic as any)[k] = (payload as any)[k];
      }
    }

    topics[idx] = topic;
    setLocal('gate_topics', topics);
    return topic;
  },

  reviseTopic: async (topicId: number, confidence: string, notes?: string) => {
    const topics = getLocal<Topic[]>('gate_topics', []);
    const idx = topics.findIndex((t) => t.id === topicId);
    if (idx === -1) throw new Error('Topic not found');

    const topic = { ...topics[idx] };
    const todayStr = new Date().toISOString().split('T')[0];

    const intervals = CONFIDENCE_INTERVALS[confidence] || [3];
    const cIdx = Math.min(topic.revision_count, intervals.length - 1);
    const intervalDays = intervals[cIdx];

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    const calculatedNext = nextDate.toISOString().split('T')[0];

    const revRecord: RevisionRecord = {
      id: `rev-${Date.now()}`,
      topic_id: topic.id,
      revision_date: todayStr,
      interval_days: intervalDays,
      confidence_rating: confidence,
      previous_next_date: topic.next_revision_date,
      calculated_next_date: calculatedNext,
      notes: notes || null,
      created_at_utc: new Date().toISOString(),
    };

    const revisions = getLocal<RevisionRecord[]>('gate_revisions', []);
    revisions.push(revRecord);
    setLocal('gate_revisions', revisions);

    topic.confidence = confidence as any;
    topic.revision_count += 1;
    topic.last_revised_date = todayStr;
    topic.next_revision_date = calculatedNext;

    if (confidence === 'Strong' && topic.revision_count >= 3) {
      topic.status = 'Mastered';
      topic.mastery_confirmed = true;
    } else if (topic.status === 'Needs Revision' || topic.status === 'Not Started') {
      topic.status = 'In Progress';
    }

    topics[idx] = topic;
    setLocal('gate_topics', topics);
    return { status: 'success', topic, revision: revRecord };
  },

  getRevisionMatrix: async (): Promise<RevisionMatrixResponse> => {
    initializeLocalStore();
    const todayStr = new Date().toISOString().split('T')[0];
    const topics = getLocal<Topic[]>('gate_topics', []);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const subMap = new Map(subjects.map((s) => [s.id, s]));

    const due_today: any[] = [];
    const overdue: any[] = [];
    const upcoming: any[] = [];
    const weak_topics: any[] = [];
    const recently_revised: any[] = [];

    for (const t of topics) {
      const s = subMap.get(t.subject_id);
      const item = {
        id: t.id,
        title: t.title,
        subject_name: s ? s.name : 'General',
        subject_color: s ? s.color : '#6366F1',
        confidence: t.confidence,
        revision_count: t.revision_count,
        next_revision_date: t.next_revision_date,
        last_revised_date: t.last_revised_date,
        status: t.status,
      };

      if (t.status === 'Needs Revision' || t.confidence === 'Weak') {
        weak_topics.push(item);
      }
      if (t.next_revision_date) {
        if (t.next_revision_date === todayStr) {
          due_today.push(item);
        } else if (t.next_revision_date < todayStr) {
          overdue.push(item);
        } else {
          upcoming.push(item);
        }
      }
      if (t.last_revised_date) {
        recently_revised.push(item);
      }
    }

    recently_revised.sort((a, b) => (b.last_revised_date || '').localeCompare(a.last_revised_date || ''));
    upcoming.sort((a, b) => (a.next_revision_date || '').localeCompare(b.next_revision_date || ''));
    overdue.sort((a, b) => (a.next_revision_date || '').localeCompare(b.next_revision_date || ''));

    return {
      due_today,
      overdue,
      upcoming: upcoming.slice(0, 15),
      weak_topics,
      recently_revised: recently_revised.slice(0, 10),
    };
  },

  // Planner
  getWorkItems: async (params?: { date?: string; start_date?: string; end_date?: string; status?: string }): Promise<WorkItem[]> => {
    initializeLocalStore();
    let items = getLocal<WorkItem[]>('gate_work_items', []);
    if (params?.date) items = items.filter((i) => i.scheduled_date === params.date);
    if (params?.start_date) items = items.filter((i) => i.scheduled_date >= params.start_date!);
    if (params?.end_date) items = items.filter((i) => i.scheduled_date <= params.end_date!);
    if (params?.status) items = items.filter((i) => i.status === params.status);
    return items;
  },

  getTodayQueue: async (date?: string) => {
    initializeLocalStore();
    const todayStr = date || new Date().toISOString().split('T')[0];
    const items = getLocal<WorkItem[]>('gate_work_items', []);

    const todayItems = items.filter((i) => i.scheduled_date === todayStr);
    const overdueItems = items.filter(
      (i) => i.scheduled_date < todayStr && ['Scheduled', 'In Progress', 'Deferred'].includes(i.status)
    );
    const nextActivity = todayItems.find((i) => ['Scheduled', 'In Progress'].includes(i.status)) || null;

    return {
      date: todayStr,
      items: todayItems,
      next_activity: nextActivity,
      overdue_count: overdueItems.length,
      overdue_items: overdueItems.slice(0, 5),
    };
  },

  getBacklog: async (): Promise<WorkItem[]> => {
    initializeLocalStore();
    const todayStr = new Date().toISOString().split('T')[0];
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    return items.filter(
      (i) => (i.scheduled_date < todayStr || i.status === 'Deferred') && ['Scheduled', 'Deferred', 'In Progress'].includes(i.status)
    );
  },

  createWorkItem: async (payload: Partial<WorkItem>): Promise<WorkItem> => {
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const topics = getLocal<Topic[]>('gate_topics', []);

    const s = subjects.find((sub) => sub.id === payload.subject_id);
    const t = topics.find((top) => top.id === payload.topic_id);

    const newItem: WorkItem = {
      id: `wi-${Date.now()}`,
      title: payload.title || 'Untitled Session',
      subject_id: payload.subject_id || null,
      topic_id: payload.topic_id || null,
      session_type: payload.session_type || 'Concept Learning',
      scheduled_date: payload.scheduled_date || new Date().toISOString().split('T')[0],
      start_time: payload.start_time || null,
      end_time: payload.end_time || null,
      estimated_duration_minutes: payload.estimated_duration_minutes || 60,
      actual_duration_minutes: 0,
      priority: payload.priority || 'Medium',
      status: payload.status || 'Scheduled',
      defer_count: 0,
      notes: payload.notes || null,
      created_at_utc: new Date().toISOString(),
      subject_name: s ? s.name : null,
      subject_color: s ? s.color : '#6366F1',
      topic_title: t ? t.title : null,
    };

    items.push(newItem);
    setLocal('gate_work_items', items);
    return newItem;
  },

  updateWorkItem: async (id: string, payload: Partial<WorkItem>): Promise<WorkItem> => {
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Work item not found');

    const updated = { ...items[idx], ...payload };
    if (payload.status === 'Completed' && !updated.completion_timestamp) {
      updated.completion_timestamp = new Date().toISOString();
    }

    items[idx] = updated;
    setLocal('gate_work_items', items);
    return updated;
  },

  deferWorkItem: async (id: string, target_date?: string): Promise<WorkItem> => {
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const idx = items.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error('Work item not found');

    const item = { ...items[idx] };
    if (!target_date) {
      const dt = new Date(item.scheduled_date);
      dt.setDate(dt.getDate() + 1);
      target_date = dt.toISOString().split('T')[0];
    }

    item.scheduled_date = target_date;
    item.defer_count += 1;
    item.status = 'Deferred';

    items[idx] = item;
    setLocal('gate_work_items', items);
    return item;
  },

  generatePlan: async (startDate?: string, targetDate?: string) => {
    initializeLocalStore();
    const settings = getLocal<UserSettings>('gate_settings', {} as any);
    const start = startDate || settings.prep_start_date || '2026-11-02';
    const target = targetDate || settings.syllabus_target_date || '2027-01-15';

    const startDt = new Date(start);
    const targetDt = new Date(target);
    const totalDays = Math.max(1, Math.floor((targetDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const weeklySchedule: Record<string, Array<{ subject_code: string; hours: number }>> = JSON.parse(
      settings.weekly_schedule_json || DEFAULT_WEEKLY_SCHEDULE_JSON
    );
    const phases: Array<{ id: number; name: string; start_date: string; end_date: string; objectives: string[] }> = JSON.parse(
      settings.phases_json || DEFAULT_PHASES_JSON
    );

    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const topics = getLocal<Topic[]>('gate_topics', []);
    const existingItems = getLocal<WorkItem[]>('gate_work_items', []);

    // Keep completed items
    const preservedItems = existingItems.filter(
      (it) => it.scheduled_date < start || it.status === 'Completed' || it.status === 'In Progress'
    );

    const subjCodeMap = new Map(subjects.map((s) => [s.code, s]));
    const topicsBySubj: Record<number, Topic[]> = {};
    for (const t of topics) {
      if (!topicsBySubj[t.subject_id]) topicsBySubj[t.subject_id] = [];
      topicsBySubj[t.subject_id].push(t);
    }

    // Linear Algebra strict sequence
    const linAlgSubj = subjCodeMap.get('LIN_ALG');
    const LA_SEQ = [
      'Vector Spaces and Subspaces',
      'Matrices & Systems of Linear Equations',
      'Linear Transformations & Matrix Representations',
      'Eigenvalues, Eigenvectors & Diagonalization',
      'Orthogonality & Projections',
      'Advanced Factorizations & SVD',
    ];
    if (linAlgSubj && topicsBySubj[linAlgSubj.id]) {
      topicsBySubj[linAlgSubj.id].sort((a, b) => {
        const aIdx = LA_SEQ.findIndex((kw) => a.title.toLowerCase().includes(kw.toLowerCase()));
        const bIdx = LA_SEQ.findIndex((kw) => b.title.toLowerCase().includes(kw.toLowerCase()));
        return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
      });
    }

    const newItems: WorkItem[] = [...preservedItems];
    const topicCursor: Record<number, number> = {};
    subjects.forEach((s) => (topicCursor[s.id] = 0));

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let d = 0; d < totalDays; d++) {
      const curDt = new Date(startDt);
      curDt.setDate(curDt.getDate() + d);
      const curDateStr = curDt.toISOString().split('T')[0];
      const dayName = dayNames[curDt.getDay()];

      // Find active phase
      const curPhase = phases.find((p) => p.start_date <= curDateStr && curDateStr <= p.end_date) || phases[0];
      const phaseId = curPhase.id;

      const daySlots = weeklySchedule[dayName] || [];
      const dailyCapMinutes = dayName === 'Sunday' ? 180 : 360; // 3h on Sun, 6h on Mon-Sat
      let allocatedMinutes = 0;

      for (const slot of daySlots) {
        if (allocatedMinutes >= dailyCapMinutes) break;

        const subj = subjCodeMap.get(slot.subject_code);
        if (!subj) continue;

        const slotMinutes = Math.floor(slot.hours * 60);
        const sTopics = topicsBySubj[subj.id] || [];
        if (!sTopics.length) continue;

        const blocks = Math.max(1, Math.floor(slotMinutes / 60));
        const blockDuration = Math.floor(slotMinutes / blocks);

        for (let b = 0; b < blocks; b++) {
          const cIdx = topicCursor[subj.id] % sTopics.length;
          const activeTopic = sTopics[cIdx];
          topicCursor[subj.id]++;

          let sessionType: WorkItem['session_type'] = 'Concept Learning';
          if (dayName === 'Sunday') {
            sessionType = b === 0 ? 'Spaced Revision' : b === 1 ? 'PYQ Practice' : 'Sectional Test';
          } else if (phaseId === 1 && slot.subject_code === 'LIN_ALG') {
            sessionType = b === 0 ? 'Concept Learning' : 'Mathematical Derivation';
          } else if (phaseId === 4) {
            sessionType = b % 2 === 0 ? 'PYQ Practice' : 'Mathematical Derivation';
          } else {
            sessionType = b === 0 ? 'Concept Learning' : b % 3 === 1 ? 'Mathematical Derivation' : 'PYQ Practice';
          }

          let title = `${activeTopic.title} (${sessionType})`;
          if (slot.subject_code === 'LIN_ALG' && phaseId === 1) {
            title = `[LA Foundation] ${activeTopic.title} — ${sessionType}`;
          }

          newItems.push({
            id: `wi-${Date.now()}-${d}-${b}-${Math.random().toString(36).substring(2, 6)}`,
            title,
            subject_id: subj.id,
            topic_id: activeTopic.id,
            session_type: sessionType,
            scheduled_date: curDateStr,
            estimated_duration_minutes: blockDuration,
            actual_duration_minutes: 0,
            priority: activeTopic.priority,
            status: 'Scheduled',
            defer_count: 0,
            subject_name: subj.name,
            subject_color: subj.color,
            topic_title: activeTopic.title,
          });

          allocatedMinutes += blockDuration;
        }
      }
    }

    // Add Final Exam Prep Mocks (Jan 16 to Feb 5, 2027) on Wednesdays (3) & Saturdays (6)
    const finalStart = new Date('2027-01-16');
    const examDate = new Date('2027-02-06');
    let curFinal = new Date(finalStart);
    let mockNum = 1;
    const maxMocks = settings.mock_target_count || 10;

    while (curFinal < examDate && mockNum <= maxMocks) {
      const dayOfWeek = curFinal.getDay();
      if (dayOfWeek === 3 || dayOfWeek === 6) {
        // Wednesday or Saturday
        const mockDateStr = curFinal.toISOString().split('T')[0];
        newItems.push({
          id: `mock-task-${mockNum}-test`,
          title: `Full-Length GATE DA Mock #${mockNum} (Official Pattern)`,
          subject_id: null,
          topic_id: null,
          session_type: 'Mock Test',
          scheduled_date: mockDateStr,
          estimated_duration_minutes: 180,
          actual_duration_minutes: 0,
          priority: 'High',
          status: 'Scheduled',
          defer_count: 0,
          subject_name: 'Full-Length Simulation',
          subject_color: '#EC4899',
          topic_title: null,
        });

        newItems.push({
          id: `mock-task-${mockNum}-analysis`,
          title: `Mock #${mockNum} Deep Analysis & Mistake Vault Logging`,
          subject_id: null,
          topic_id: null,
          session_type: 'Mock Analysis',
          scheduled_date: mockDateStr,
          estimated_duration_minutes: 120,
          actual_duration_minutes: 0,
          priority: 'High',
          status: 'Scheduled',
          defer_count: 0,
          subject_name: 'Mock Test Analysis',
          subject_color: '#F59E0B',
          topic_title: null,
        });

        mockNum++;
      }
      curFinal.setDate(curFinal.getDate() + 1);
    }

    setLocal('gate_work_items', newItems);
    return {
      status: 'success',
      message: `Generated ${newItems.length} study tasks aligned with 39h weekly schedule and 4 preparation phases.`,
      created_count: newItems.length,
    };
  },

  reflowBacklog: async (targetStartDate?: string) => {
    initializeLocalStore();
    const settings = getLocal<UserSettings>('gate_settings', {} as any);
    const startStr = targetStartDate || new Date().toISOString().split('T')[0];
    const items = getLocal<WorkItem[]>('gate_work_items', []);

    const overdue = items.filter(
      (i) => i.scheduled_date < startStr && ['Scheduled', 'Deferred', 'In Progress'].includes(i.status)
    );

    if (!overdue.length) {
      return { status: 'success', message: 'No backlog tasks to reflow.', reflowed_count: 0, is_feasible: true };
    }

    const dayLoad: Record<string, number> = {};
    items
      .filter((i) => i.scheduled_date >= startStr && ['Scheduled', 'In Progress'].includes(i.status))
      .forEach((i) => {
        dayLoad[i.scheduled_date] = (dayLoad[i.scheduled_date] || 0) + i.estimated_duration_minutes;
      });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let reflowed = 0;
    let dayOffset = 0;

    for (const item of overdue) {
      let placed = false;
      while (!placed && dayOffset < 60) {
        const candDt = new Date(startStr);
        candDt.setDate(candDt.getDate() + dayOffset);
        const candStr = candDt.toISOString().split('T')[0];
        const dayName = dayNames[candDt.getDay()];
        const cap = dayName === 'Sunday' ? 180 : 360; // 3h on Sun, 6h on Mon-Sat

        const curMin = dayLoad[candStr] || 0;
        if (curMin + item.estimated_duration_minutes <= cap) {
          item.scheduled_date = candStr;
          item.defer_count += 1;
          item.status = 'Scheduled';
          dayLoad[candStr] = curMin + item.estimated_duration_minutes;
          reflowed++;
          placed = true;
        } else {
          dayOffset++;
        }
      }
      if (!placed) {
        const candDt = new Date(startStr);
        candDt.setDate(candDt.getDate() + dayOffset);
        item.scheduled_date = candDt.toISOString().split('T')[0];
        item.defer_count += 1;
        item.status = 'Scheduled';
        reflowed++;
        dayOffset++;
      }
    }

    setLocal('gate_work_items', items);

    const totalBacklogHours = Math.round(overdue.reduce((a, b) => a + b.estimated_duration_minutes, 0) / 60);
    const targetDt = new Date(settings.syllabus_target_date || '2027-01-15');
    const startDt = new Date(startStr);
    const remainingDays = Math.max(1, Math.floor((targetDt.getTime() - startDt.getTime()) / (1000 * 60 * 60 * 24)));
    const isFeasible = totalBacklogHours <= remainingDays * 6;

    let warning = null;
    if (!isFeasible) {
      warning = `Workload alert: Backlog of ${totalBacklogHours} hours exceeds standard capacity for the ${remainingDays} days remaining until syllabus deadline (${settings.syllabus_target_date}).`;
    }

    return {
      status: 'success',
      message: `Reflowed ${reflowed} backlog tasks across upcoming available days without capacity overflow.`,
      reflowed_count: reflowed,
      is_feasible: isFeasible,
      deficit_warning: warning,
    };
  },

  // Sessions
  getStudySessions: async (limit: number = 20): Promise<StudySession[]> => {
    initializeLocalStore();
    const sessions = getLocal<StudySession[]>('gate_sessions', []);
    sessions.sort((a, b) => b.start_timestamp.localeCompare(a.start_timestamp));
    return sessions.slice(0, limit);
  },

  createStudySession: async (payload: Partial<StudySession>): Promise<StudySession> => {
    const sessions = getLocal<StudySession[]>('gate_sessions', []);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const topics = getLocal<Topic[]>('gate_topics', []);
    const items = getLocal<WorkItem[]>('gate_work_items', []);

    const s = subjects.find((sub) => sub.id === payload.subject_id);
    const t = topics.find((top) => top.id === payload.topic_id);

    const dur = payload.duration_seconds || 0;
    const newSession: StudySession = {
      id: `sess-${Date.now()}`,
      work_item_id: payload.work_item_id || null,
      topic_id: payload.topic_id || null,
      subject_id: payload.subject_id || null,
      session_type: payload.session_type || 'Concept Learning',
      start_timestamp: payload.start_timestamp || new Date().toISOString(),
      end_timestamp: payload.end_timestamp || new Date().toISOString(),
      duration_seconds: dur,
      mode: payload.mode || 'Pomodoro',
      questions_practiced: payload.questions_practiced || 0,
      confidence_rating: payload.confidence_rating || null,
      created_at_utc: new Date().toISOString(),
      subject_name: s ? s.name : null,
      subject_color: s ? s.color : '#6366F1',
      topic_title: t ? t.title : null,
    };

    sessions.push(newSession);
    setLocal('gate_sessions', sessions);

    // Update topic hours
    if (payload.topic_id) {
      const topIdx = topics.findIndex((top) => top.id === payload.topic_id);
      if (topIdx !== -1) {
        topics[topIdx].actual_hours = Math.round((topics[topIdx].actual_hours + dur / 3600) * 10) / 10;
        topics[topIdx].last_studied_date = new Date().toISOString().split('T')[0];
        setLocal('gate_topics', topics);
      }
    }

    // Update work item duration
    if (payload.work_item_id) {
      const wIdx = items.findIndex((wi) => wi.id === payload.work_item_id);
      if (wIdx !== -1) {
        items[wIdx].actual_duration_minutes += Math.floor(dur / 60);
        setLocal('gate_work_items', items);
      }
    }

    return newSession;
  },

  // Interactions
  getMorningCheckin: async (date?: string) => {
    initializeLocalStore();
    const todayStr = date || new Date().toISOString().split('T')[0];
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const sessions = getLocal<StudySession[]>('gate_sessions', []);

    const yesterdayDt = new Date();
    yesterdayDt.setDate(yesterdayDt.getDate() - 1);
    const yesterdayStr = yesterdayDt.toISOString().split('T')[0];

    const yesterdayItems = items.filter((i) => i.scheduled_date === yesterdayStr);
    const yesterdayLogged = sessions
      .filter((s) => s.start_timestamp.startsWith(yesterdayStr))
      .reduce((acc, s) => acc + s.duration_seconds, 0);

    const todayItems = items.filter((i) => i.scheduled_date === todayStr);

    return {
      already_completed: false,
      interaction_date: todayStr,
      yesterday_date: yesterdayStr,
      yesterday_planned_count: yesterdayItems.length,
      yesterday_completed_count: yesterdayItems.filter((i) => i.status === 'Completed').length,
      yesterday_logged_hours: Math.round((yesterdayLogged / 3600) * 10) / 10,
      today_planned_count: todayItems.length,
      today_estimated_hours: Math.round(todayItems.reduce((acc, i) => acc + i.estimated_duration_minutes, 0) / 60 * 10) / 10,
      today_items: todayItems,
    };
  },

  submitMorningCheckin: async (date: string, answers: any) => {
    const interactions = getLocal<any[]>('gate_interactions', []);
    interactions.push({
      id: `int-${Date.now()}`,
      interaction_type: 'morning_checkin',
      interaction_date: date,
      answers,
      created_at_utc: new Date().toISOString(),
    });
    setLocal('gate_interactions', interactions);
    return { status: 'success', message: 'Morning check-in confirmed.' };
  },

  getEveningReview: async (date?: string) => {
    initializeLocalStore();
    const todayStr = date || new Date().toISOString().split('T')[0];
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const sessions = getLocal<StudySession[]>('gate_sessions', []);

    const todayItems = items.filter((i) => i.scheduled_date === todayStr);
    const todaySeconds = sessions
      .filter((s) => s.start_timestamp.startsWith(todayStr))
      .reduce((acc, s) => acc + s.duration_seconds, 0);

    return {
      already_completed: false,
      interaction_date: todayStr,
      today_items_count: todayItems.length,
      today_completed_count: todayItems.filter((i) => i.status === 'Completed').length,
      today_logged_hours: Math.round((todaySeconds / 3600) * 10) / 10,
      incomplete_items: todayItems.filter((i) => i.status !== 'Completed'),
    };
  },

  submitEveningReview: async (date: string, answers: any) => {
    const interactions = getLocal<any[]>('gate_interactions', []);
    interactions.push({
      id: `int-${Date.now()}`,
      interaction_type: 'evening_review',
      interaction_date: date,
      answers,
      created_at_utc: new Date().toISOString(),
    });
    setLocal('gate_interactions', interactions);

    if (answers?.reflow_missed) {
      await localStore.reflowBacklog();
    }
    return { status: 'success', message: 'Evening review saved successfully.' };
  },

  submitTaskCompletion: async (payload: {
    work_item_id: string;
    confidence_rating: string;
    practiced_questions: boolean;
    questions_count?: number;
    session_id?: string;
  }) => {
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const wIdx = items.findIndex((i) => i.id === payload.work_item_id);

    let topicId = null;
    if (wIdx !== -1) {
      items[wIdx].status = 'Completed';
      items[wIdx].completion_timestamp = new Date().toISOString();
      topicId = items[wIdx].topic_id;
      setLocal('gate_work_items', items);
    }

    if (topicId) {
      await localStore.reviseTopic(
        topicId,
        payload.confidence_rating,
        `Completed session with ${payload.questions_count || 0} questions.`
      );
      if (payload.practiced_questions && (payload.questions_count || 0) > 0) {
        const topics = getLocal<Topic[]>('gate_topics', []);
        const tIdx = topics.findIndex((t) => t.id === topicId);
        if (tIdx !== -1) {
          topics[tIdx].pyqs_solved += payload.questions_count || 0;
          setLocal('gate_topics', topics);
        }
      }
    }

    return { status: 'success', message: 'Task feedback recorded and next revision scheduled.' };
  },

  getInteractionHistory: async () => {
    return getLocal<any[]>('gate_interactions', []);
  },

  // Mock Tests
  getMockTests: async (): Promise<MockTest[]> => {
    initializeLocalStore();
    return getLocal<MockTest[]>('gate_mocks', []);
  },

  getMockTestDetail: async (id: string) => {
    initializeLocalStore();
    const mocks = getLocal<MockTest[]>('gate_mocks', []);
    const mock = mocks.find((m) => m.id === id);
    if (!mock) throw new Error('Mock test not found');

    const results = getLocal<MockSubjectResult[]>('gate_mock_results', []).filter((r) => r.mock_test_id === id);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const subMap = new Map(subjects.map((s) => [s.id, s]));

    const enriched = results.map((r) => ({
      ...r,
      subject_name: subMap.get(r.subject_id)?.name || 'Unknown',
      subject_color: subMap.get(r.subject_id)?.color || '#6366F1',
    }));

    return { mock_test: mock, subject_breakdown: enriched };
  },

  createMockTest: async (payload: any): Promise<MockTest> => {
    const mocks = getLocal<MockTest[]>('gate_mocks', []);
    const mockResults = getLocal<MockSubjectResult[]>('gate_mock_results', []);
    const mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);

    let gross = 0;
    let neg = 0;
    let correct = 0;
    let incorrect = 0;
    let attempted = 0;

    const subStats: Record<number, any> = {};

    for (const q of payload.questions || []) {
      if (!subStats[q.subject_id]) {
        subStats[q.subject_id] = { total: 0, attempted: 0, correct: 0, incorrect: 0, obtained: 0, negative: 0 };
      }
      const stat = subStats[q.subject_id];
      stat.total++;

      const marks = q.question_type?.includes('2-mark') ? 2.0 : 1.0;
      let posQ = 0;
      let negQ = 0;

      if (q.user_status === 'correct') {
        posQ = marks;
        correct++;
        attempted++;
        stat.correct++;
        stat.attempted++;
      } else if (q.user_status === 'incorrect') {
        if (q.question_type?.includes('MCQ')) {
          negQ = marks === 2.0 ? 2 / 3 : 1 / 3;
        }
        incorrect++;
        attempted++;
        stat.incorrect++;
        stat.attempted++;

        // Add to mistake vault
        mistakes.push({
          id: `mis-${Date.now()}-${Math.random()}`,
          mock_test_id: `mock-${Date.now()}`,
          subject_id: q.subject_id,
          topic_id: q.topic_id || null,
          question_text: q.question_text || 'Mock question',
          question_type: q.question_type || '1-mark MCQ',
          marks,
          error_category: q.error_category || 'Conceptual Gap',
          your_answer: q.your_answer || null,
          correct_answer: q.correct_answer || null,
          solution_notes: q.solution_notes || null,
          is_resolved: false,
          created_at_utc: new Date().toISOString(),
        });
      }

      gross += posQ;
      neg += negQ;
      stat.obtained += posQ - negQ;
      stat.negative += negQ;
    }

    const netScore = Math.round((gross - neg) * 100) / 100;
    const totalQuestions = payload.questions?.length || 65;

    const newMock: MockTest = {
      id: `mock-${Date.now()}`,
      title: payload.title,
      provider: payload.provider || 'Self-Administered',
      test_type: payload.test_type || 'Full-Length Mock',
      test_date: payload.test_date || new Date().toISOString().split('T')[0],
      time_taken_minutes: payload.time_taken_minutes || 180,
      total_marks: payload.questions?.length ? payload.questions.length * 1.5 : 100,
      marks_obtained: netScore,
      gross_positive_marks: Math.round(gross * 100) / 100,
      negative_marks_lost: Math.round(neg * 100) / 100,
      questions_attempted: attempted,
      correct_count: correct,
      incorrect_count: incorrect,
      unattempted_count: totalQuestions - attempted,
      accuracy_pct: attempted > 0 ? Math.round((correct / attempted) * 1000) / 10 : 0,
      attempt_rate_pct: totalQuestions > 0 ? Math.round((attempted / totalQuestions) * 1000) / 10 : 0,
      rank: payload.rank || null,
      percentile: payload.percentile || null,
      notes: payload.notes || null,
      created_at_utc: new Date().toISOString(),
    };

    mocks.push(newMock);
    setLocal('gate_mocks', mocks);
    setLocal('gate_mistakes', mistakes);

    for (const sId in subStats) {
      const st = subStats[sId];
      mockResults.push({
        id: `sr-${Date.now()}-${sId}`,
        mock_test_id: newMock.id,
        subject_id: Number(sId),
        total_questions: st.total,
        attempted: st.attempted,
        correct: st.correct,
        incorrect: st.incorrect,
        marks_obtained: Math.round(st.obtained * 100) / 100,
        negative_marks: Math.round(st.negative * 100) / 100,
      });
    }
    setLocal('gate_mock_results', mockResults);

    return newMock;
  },

  // Mistake Vault
  getMistakes: async (params?: { subject_id?: number; topic_id?: number; error_category?: string; is_resolved?: boolean }): Promise<MistakeLog[]> => {
    initializeLocalStore();
    let mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const topics = getLocal<Topic[]>('gate_topics', []);
    const subMap = new Map(subjects.map((s) => [s.id, s]));
    const topMap = new Map(topics.map((t) => [t.id, t]));

    if (params?.subject_id) mistakes = mistakes.filter((m) => m.subject_id === params.subject_id);
    if (params?.topic_id) mistakes = mistakes.filter((m) => m.topic_id === params.topic_id);
    if (params?.error_category && params.error_category !== 'all') mistakes = mistakes.filter((m) => m.error_category === params.error_category);
    if (params?.is_resolved !== undefined) mistakes = mistakes.filter((m) => m.is_resolved === params.is_resolved);

    return mistakes.map((m) => ({
      ...m,
      subject_name: subMap.get(m.subject_id)?.name || null,
      subject_color: subMap.get(m.subject_id)?.color || '#6366F1',
      topic_title: m.topic_id ? topMap.get(m.topic_id)?.title || null : null,
    }));
  },

  createMistake: async (payload: Partial<MistakeLog>): Promise<MistakeLog> => {
    const mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);
    const newMistake: MistakeLog = {
      id: `mis-${Date.now()}`,
      mock_test_id: payload.mock_test_id || null,
      subject_id: payload.subject_id || 1,
      topic_id: payload.topic_id || null,
      question_text: payload.question_text || '',
      question_type: payload.question_type || '1-mark MCQ',
      marks: payload.marks || 1.0,
      error_category: payload.error_category || 'Conceptual Gap',
      your_answer: payload.your_answer || null,
      correct_answer: payload.correct_answer || null,
      solution_notes: payload.solution_notes || null,
      image_url: payload.image_url || null,
      is_resolved: false,
      created_at_utc: new Date().toISOString(),
    };
    mistakes.push(newMistake);
    setLocal('gate_mistakes', mistakes);
    return newMistake;
  },

  resolveMistake: async (id: string, is_resolved: boolean = true): Promise<MistakeLog> => {
    const mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);
    const idx = mistakes.findIndex((m) => m.id === id);
    if (idx === -1) throw new Error('Mistake not found');

    mistakes[idx].is_resolved = is_resolved;
    mistakes[idx].resolved_at_utc = is_resolved ? new Date().toISOString() : null;
    setLocal('gate_mistakes', mistakes);
    return mistakes[idx];
  },

  // Journal
  getJournalEntries: async (params?: { entry_type?: string; subject_id?: number; topic_id?: number; is_pinned?: boolean; search?: string }): Promise<JournalEntry[]> => {
    initializeLocalStore();
    let entries = getLocal<JournalEntry[]>('gate_journal', []);
    const subjects = getLocal<Subject[]>('gate_subjects', []);
    const topics = getLocal<Topic[]>('gate_topics', []);
    const subMap = new Map(subjects.map((s) => [s.id, s]));
    const topMap = new Map(topics.map((t) => [t.id, t]));

    if (params?.entry_type) entries = entries.filter((e) => e.entry_type === params.entry_type);
    if (params?.subject_id) entries = entries.filter((e) => e.subject_id === params.subject_id);
    if (params?.topic_id) entries = entries.filter((e) => e.topic_id === params.topic_id);
    if (params?.is_pinned !== undefined) entries = entries.filter((e) => e.is_pinned === params.is_pinned);
    if (params?.search) {
      const q = params.search.toLowerCase();
      entries = entries.filter((e) => e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q));
    }

    return entries.map((e) => ({
      ...e,
      subject_name: e.subject_id ? subMap.get(e.subject_id)?.name || null : null,
      subject_color: e.subject_id ? subMap.get(e.subject_id)?.color || '#6366F1' : '#6366F1',
      topic_title: e.topic_id ? topMap.get(e.topic_id)?.title || null : null,
    }));
  },

  createJournalEntry: async (payload: Partial<JournalEntry> & { tags?: string[] }): Promise<JournalEntry> => {
    const entries = getLocal<JournalEntry[]>('gate_journal', []);
    const newEntry: JournalEntry = {
      id: `j-${Date.now()}`,
      title: payload.title || 'Untitled Note',
      entry_type: payload.entry_type || 'Daily Reflection',
      content: payload.content || '',
      subject_id: payload.subject_id || null,
      topic_id: payload.topic_id || null,
      tags_json: JSON.stringify(payload.tags || []),
      is_pinned: payload.is_pinned || false,
      created_at_utc: new Date().toISOString(),
      updated_at_utc: new Date().toISOString(),
    };
    entries.unshift(newEntry);
    setLocal('gate_journal', entries);
    return newEntry;
  },

  updateJournalEntry: async (id: string, payload: Partial<JournalEntry> & { tags?: string[] }): Promise<JournalEntry> => {
    const entries = getLocal<JournalEntry[]>('gate_journal', []);
    const idx = entries.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error('Journal entry not found');

    const updated = {
      ...entries[idx],
      ...payload,
      tags_json: payload.tags ? JSON.stringify(payload.tags) : entries[idx].tags_json,
      updated_at_utc: new Date().toISOString(),
    };
    entries[idx] = updated;
    setLocal('gate_journal', entries);
    return updated;
  },

  deleteJournalEntry: async (id: string) => {
    let entries = getLocal<JournalEntry[]>('gate_journal', []);
    entries = entries.filter((e) => e.id !== id);
    setLocal('gate_journal', entries);
    return { status: 'success' };
  },

  // Analytics
  getDashboardAnalytics: async (): Promise<DashboardKPIs> => {
    initializeLocalStore();
    const settings = getLocal<UserSettings>('gate_settings', {} as any);
    const topics = getLocal<Topic[]>('gate_topics', []);
    const sessions = getLocal<StudySession[]>('gate_sessions', []);
    const items = getLocal<WorkItem[]>('gate_work_items', []);
    const mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);
    const mocks = getLocal<MockTest[]>('gate_mocks', []);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const examDt = new Date(settings.exam_date || '2027-02-06T09:30:00+05:30');
    const diffMs = Math.max(0, examDt.getTime() - now.getTime());
    const daysRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    const hoursRemaining = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

    // Deadline Intelligence
    const syllabusDeadlineStr = settings.syllabus_target_date || '2027-01-15';
    const syllabusDeadlineDt = new Date(syllabusDeadlineStr);
    const daysToSyllabusDeadline = Math.max(0, Math.floor((syllabusDeadlineDt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const remainingWeeks = Math.max(0.1, daysToSyllabusDeadline / 7.0);

    const phases: Array<{ id: number; name: string; start_date: string; end_date: string; objectives: string[] }> = JSON.parse(
      settings.phases_json || DEFAULT_PHASES_JSON
    );
    const curPhase = phases.find((p) => p.start_date <= todayStr && todayStr <= p.end_date) || phases[0];
    const nextMilestone = `${curPhase.name} Deadline: ${curPhase.end_date}`;

    const totalEst = topics.reduce((acc, t) => acc + t.estimated_hours, 0);
    const weightedSum = topics.reduce((acc, t) => acc + (t.completion_percentage / 100) * t.estimated_hours, 0);
    const progressPct = totalEst > 0 ? Math.round((weightedSum / totalEst) * 10000) / 100 : 0;
    const remainingEstHours = Math.round(topics.reduce((acc, t) => acc + (1 - t.completion_percentage / 100) * t.estimated_hours, 0) * 10) / 10;

    const totalStudySec = sessions.reduce((acc, s) => acc + s.duration_seconds, 0);
    const totalStudyHours = Math.round((totalStudySec / 3600) * 10) / 10;

    // Current week actual hours (Monday to Sunday)
    const curDay = now.getDay();
    const distToMon = (curDay + 6) % 7;
    const monDt = new Date(now);
    monDt.setDate(monDt.getDate() - distToMon);
    const monStr = monDt.toISOString().split('T')[0];
    const weekSec = sessions
      .filter((s) => s.start_timestamp.slice(0, 10) >= monStr)
      .reduce((acc, s) => acc + s.duration_seconds, 0);
    const weeklyActualHours = Math.round((weekSec / 3600) * 10) / 10;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSec = sessions
      .filter((s) => new Date(s.start_timestamp) >= weekAgo)
      .reduce((acc, s) => acc + s.duration_seconds, 0);
    const sevenDayAvg = Math.round((recentSec / 3600 / 7) * 10) / 10;

    const unfinished = items.filter((i) => i.scheduled_date < todayStr && ['Scheduled', 'Deferred', 'In Progress'].includes(i.status));
    const needsRevisionCount = topics.filter((t) => t.status === 'Needs Revision').length;
    const overdueSrsTopics = topics.filter((t) => t.next_revision_date && t.next_revision_date < todayStr);

    const pendingPyqs = topics.reduce((acc, t) => acc + Math.max(0, (t.pyqs_target || 20) - (t.pyqs_solved || 0)), 0);
    const unresolvedMistakes = mistakes.filter((m) => !m.is_resolved).length;

    const latestMock = mocks.length > 0 ? mocks[mocks.length - 1].marks_obtained : null;

    const reqDailyHours = Math.round((remainingEstHours / Math.max(1, daysToSyllabusDeadline)) * 10) / 10;
    const reqWeeklyHours = Math.round((remainingEstHours / remainingWeeks) * 10) / 10;

    const weeklyTarget = settings.weekly_target_hours || 39.0;
    const isBehind = reqWeeklyHours > weeklyTarget || (sevenDayAvg > 0 && sevenDayAvg < (settings.daily_target_hours || 6.0) - 1.5);

    let deficitWarning: string | null = null;
    if (reqWeeklyHours > weeklyTarget) {
      deficitWarning = `Pace Alert: To complete all topics by January 15 (${daysToSyllabusDeadline} days left), you need ${reqWeeklyHours}h/week, exceeding your ${weeklyTarget}h weekly target. Prioritize foundational high-yield topics or reflow your backlog.`;
    }

    const observations: string[] = [];
    if (curPhase) {
      observations.push(`Current Milestone: ${curPhase.name} (${curPhase.start_date} to ${curPhase.end_date}).`);
    }
    if (overdueSrsTopics.length > 0) {
      observations.push(`You have ${overdueSrsTopics.length} topic(s) overdue for spaced repetition revision.`);
    }
    if (unfinished.length > 0) {
      observations.push(`You have ${unfinished.length} unfinished backlog activity(ies) from previous days.`);
    }
    if (deficitWarning) {
      observations.push(deficitWarning);
    } else {
      observations.push('Maintain your 6h Monday–Saturday and 3h Sunday schedule to reach the January 15 milestone!');
    }

    return {
      countdown: {
        exam_name: settings.exam_name || 'GATE 2027 DA',
        exam_timestamp: settings.exam_date || '2027-02-06T09:30:00+05:30',
        days_remaining: daysRemaining,
        hours_remaining: hoursRemaining,
        today_date: todayStr,
        prep_start_date: settings.prep_start_date || '2026-11-02',
        syllabus_target_date: syllabusDeadlineStr,
        days_to_syllabus_deadline: daysToSyllabusDeadline,
        current_phase: curPhase,
        next_milestone: nextMilestone,
      },
      kpis: {
        weighted_syllabus_completion_pct: progressPct,
        total_topics: topics.length,
        completed_topics: topics.filter((t) => t.status === 'Completed' || t.status === 'Mastered').length,
        mastered_topics: topics.filter((t) => t.status === 'Mastered').length,
        needs_revision_topics: needsRevisionCount,
        in_progress_topics: topics.filter((t) => t.status === 'In Progress').length,
        not_started_topics: topics.filter((t) => t.status === 'Not Started').length,
        total_actual_study_hours: totalStudyHours,
        total_planned_hours: Math.round(items.reduce((acc, i) => acc + i.estimated_duration_minutes, 0) / 60 * 10) / 10,
        seven_day_avg_daily_hours: sevenDayAvg,
        weekly_actual_hours: weeklyActualHours,
        weekly_target_hours: weeklyTarget,
        remaining_estimated_hours: remainingEstHours,
        required_daily_runrate_hours: reqDailyHours,
        required_weekly_runrate_hours: reqWeeklyHours,
        target_daily_hours: settings.daily_target_hours || 6.0,
        current_streak_days: totalStudyHours > 0 ? 1 : 0,
        unfinished_count: unfinished.length,
        overdue_srs_count: overdueSrsTopics.length,
        pending_pyqs_count: pendingPyqs,
        unresolved_mistakes_count: unresolvedMistakes,
        latest_mock_score: latestMock,
        is_behind_schedule: isBehind,
        deficit_warning: deficitWarning,
      },
      observations,
    };
  },

  getComprehensiveAnalytics: async (): Promise<ComprehensiveAnalytics> => {
    initializeLocalStore();
    const subjects = await localStore.getSubjects();
    const mistakes = getLocal<MistakeLog[]>('gate_mistakes', []);
    const mocks = getLocal<MockTest[]>('gate_mocks', []);

    const categories = [
      'Conceptual Gap',
      'Formula or Theorem Forgetting',
      'Calculation or Algebra Error',
      'Question Misinterpretation',
      'Time Pressure or Guessing',
    ];
    const mistakeDist = categories.map((cat) => ({
      category: cat,
      count: mistakes.filter((m) => m.error_category === cat).length,
    }));

    return {
      subject_analytics: subjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        color: s.color,
        exam_weightage: s.exam_weightage,
        baseline_level: s.baseline_level,
        total_topics: s.topic_count || 0,
        completed_topics: s.completed_count || 0,
        estimated_hours: s.estimated_hours || 0,
        actual_hours: s.actual_hours || 0,
        progress_pct: s.completion_percentage || 0,
        mock_tests_taken: 0,
        mock_marks_obtained: 0,
        has_sufficient_mock_data: false,
      })),
      daily_history: [],
      mistake_distribution: mistakeDist,
      mock_history: mocks.map((m) => ({
        id: m.id,
        title: m.title,
        date: m.test_date,
        net_score: m.marks_obtained,
        gross_score: m.gross_positive_marks,
        negative_marks: m.negative_marks_lost,
        accuracy_pct: m.accuracy_pct,
        attempt_rate_pct: m.attempt_rate_pct,
      })),
      total_mistakes: mistakes.length,
      unresolved_mistakes: mistakes.filter((m) => !m.is_resolved).length,
    };
  },

  // Backup & Reset
  exportFullDatabase: async () => {
    return {
      version: '3.0.0',
      exported_at_utc: new Date().toISOString(),
      user_settings: [getLocal('gate_settings', null)],
      subjects: getLocal('gate_subjects', []),
      chapters: getLocal('gate_chapters', []),
      topics: getLocal('gate_topics', []),
      work_items: getLocal('gate_work_items', []),
      study_sessions: getLocal('gate_sessions', []),
      revision_records: getLocal('gate_revisions', []),
      mock_tests: getLocal('gate_mocks', []),
      mock_subject_results: getLocal('gate_mock_results', []),
      mistake_logs: getLocal('gate_mistakes', []),
      journal_entries: getLocal('gate_journal', []),
      interaction_records: getLocal('gate_interactions', []),
    };
  },

  importFullDatabase: async (data: any) => {
    if (!data || data.version !== '3.0.0') throw new Error('Invalid backup format');
    if (data.user_settings?.[0]) setLocal('gate_settings', data.user_settings[0]);
    if (data.work_items) setLocal('gate_work_items', data.work_items);
    if (data.study_sessions) setLocal('gate_sessions', data.study_sessions);
    if (data.revision_records) setLocal('gate_revisions', data.revision_records);
    if (data.mock_tests) setLocal('gate_mocks', data.mock_tests);
    if (data.mock_subject_results) setLocal('gate_mock_results', data.mock_subject_results);
    if (data.mistake_logs) setLocal('gate_mistakes', data.mistake_logs);
    if (data.journal_entries) setLocal('gate_journal', data.journal_entries);
    if (data.topics) setLocal('gate_topics', data.topics);
    return { status: 'success', message: 'Restored from JSON backup.' };
  },

  resetPreparation: async () => {
    localStorage.removeItem('gate_initialized_v3');
    initializeLocalStore();
    return { status: 'success', message: 'Reset preparation progress.' };
  },
};

