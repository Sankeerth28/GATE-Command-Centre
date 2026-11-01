import type {
  UserSettings, Subject, SubjectTreeItem, Topic, WorkItem, StudySession,
  RevisionMatrixResponse, MockTest, MistakeLog, JournalEntry,
  DashboardKPIs, ComprehensiveAnalytics
} from '../types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `API error ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Settings
  getSettings: () => fetchJson<UserSettings>('/settings/'),
  updateSettings: (payload: Partial<UserSettings>) =>
    fetchJson<UserSettings>('/settings/', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // Syllabus
  getSubjects: () => fetchJson<Subject[]>('/syllabus/subjects'),
  getSyllabusTree: () => fetchJson<SubjectTreeItem[]>('/syllabus/tree'),
  getTopicDetail: (topicId: number) => fetchJson<any>(`/syllabus/topics/${topicId}`),
  updateTopic: (topicId: number, payload: Partial<Topic> & { subtopics?: any[] }) =>
    fetchJson<Topic>(`/syllabus/topics/${topicId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  reviseTopic: (topicId: number, confidence: string, notes?: string) =>
    fetchJson<any>(`/syllabus/topics/${topicId}/revise`, {
      method: 'POST',
      body: JSON.stringify({ confidence, notes }),
    }),
  getRevisionMatrix: () => fetchJson<RevisionMatrixResponse>('/syllabus/revisions'),

  // Planner & Tasks
  getWorkItems: (params?: { date?: string; start_date?: string; end_date?: string; status?: string }) => {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return fetchJson<WorkItem[]>(`/planner/items?${query}`);
  },
  getTodayQueue: (date?: string) =>
    fetchJson<{
      date: string;
      items: WorkItem[];
      next_activity?: WorkItem | null;
      overdue_count: number;
      overdue_items: WorkItem[];
    }>(`/planner/today${date ? `?date=${date}` : ''}`),
  getBacklog: () => fetchJson<WorkItem[]>('/planner/backlog'),
  createWorkItem: (payload: Partial<WorkItem>) =>
    fetchJson<WorkItem>('/planner/items', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateWorkItem: (id: string, payload: Partial<WorkItem>) =>
    fetchJson<WorkItem>(`/planner/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deferWorkItem: (id: string, target_date?: string) =>
    fetchJson<WorkItem>(`/planner/items/${id}/defer`, {
      method: 'POST',
      body: JSON.stringify({ target_date }),
    }),
  generatePlan: (startDate?: string, targetDate?: string) =>
    fetchJson<{ status: string; message: string; created_count: number }>('/planner/generate-plan', {
      method: 'POST',
      body: JSON.stringify({ start_date: startDate, target_date: targetDate }),
    }),
  reflowBacklog: (targetStartDate?: string) =>
    fetchJson<{ status: string; message: string; reflowed_count: number }>('/planner/reflow-backlog', {
      method: 'POST',
      body: JSON.stringify({ target_start_date: targetStartDate }),
    }),

  // Study Sessions
  getStudySessions: (limit: number = 20) =>
    fetchJson<StudySession[]>(`/sessions/?limit=${limit}`),
  createStudySession: (payload: Partial<StudySession>) =>
    fetchJson<StudySession>('/sessions/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Intelligent Interaction Engine
  getMorningCheckin: (date?: string) =>
    fetchJson<any>(`/interactions/morning-checkin${date ? `?date=${date}` : ''}`),
  submitMorningCheckin: (date: string, answers: any) =>
    fetchJson<any>('/interactions/morning-checkin', {
      method: 'POST',
      body: JSON.stringify({ interaction_date: date, answers }),
    }),
  getEveningReview: (date?: string) =>
    fetchJson<any>(`/interactions/evening-review${date ? `?date=${date}` : ''}`),
  submitEveningReview: (date: string, answers: any) =>
    fetchJson<any>('/interactions/evening-review', {
      method: 'POST',
      body: JSON.stringify({ interaction_date: date, answers }),
    }),
  submitTaskCompletion: (payload: {
    work_item_id: string;
    confidence_rating: string;
    practiced_questions: boolean;
    questions_count?: number;
    session_id?: string;
  }) =>
    fetchJson<any>('/interactions/task-completion', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getInteractionHistory: () => fetchJson<any[]>('/interactions/history'),

  // Mock Tests
  getMockTests: () => fetchJson<MockTest[]>('/mocks/'),
  getMockTestDetail: (id: string) => fetchJson<any>(`/mocks/${id}`),
  createMockTest: (payload: any) =>
    fetchJson<MockTest>('/mocks/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Mistake Vault
  getMistakes: (params?: { subject_id?: number; topic_id?: number; error_category?: string; is_resolved?: boolean }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJson<MistakeLog[]>(`/mistakes/?${query}`);
  },
  createMistake: (payload: Partial<MistakeLog>) =>
    fetchJson<MistakeLog>('/mistakes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  resolveMistake: (id: string, is_resolved: boolean = true) =>
    fetchJson<MistakeLog>(`/mistakes/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ is_resolved }),
    }),

  // Study & Formula Journal
  getJournalEntries: (params?: { entry_type?: string; subject_id?: number; topic_id?: number; is_pinned?: boolean; search?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchJson<JournalEntry[]>(`/journal/?${query}`);
  },
  createJournalEntry: (payload: Partial<JournalEntry> & { tags?: string[] }) =>
    fetchJson<JournalEntry>('/journal/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateJournalEntry: (id: string, payload: Partial<JournalEntry> & { tags?: string[] }) =>
    fetchJson<JournalEntry>(`/journal/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteJournalEntry: (id: string) =>
    fetchJson<{ status: string }>(`/journal/${id}`, {
      method: 'DELETE',
    }),

  // Analytics & Intelligence
  getDashboardAnalytics: () => fetchJson<DashboardKPIs>('/analytics/dashboard'),
  getComprehensiveAnalytics: () => fetchJson<ComprehensiveAnalytics>('/analytics/comprehensive'),

  // Data Management
  exportFullDatabase: () => fetchJson<any>('/data/export'),
  importFullDatabase: (data: any) =>
    fetchJson<any>('/data/import', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resetPreparation: () =>
    fetchJson<any>('/data/reset', {
      method: 'POST',
    }),
};
