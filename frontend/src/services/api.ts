import type {
  UserSettings, Subject, SubjectTreeItem, Topic, WorkItem, StudySession,
  RevisionMatrixResponse, MockTest, MistakeLog, JournalEntry,
  DashboardKPIs, ComprehensiveAnalytics
} from '../types';
import { localStore } from './localStore';

const ENV_API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '';

function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('gate_backend_url');
    if (custom) return custom.replace(/\/+$/, '');
  }
  return (ENV_API_BASE || '/api').replace(/\/+$/, '');
}

// Determine if we are hosted statically without a live backend configured
function isStaticOrGhPages(): boolean {
  if (typeof window === 'undefined') return false;
  const custom = localStorage.getItem('gate_backend_url');
  if (custom) return false;
  if (ENV_API_BASE) return false;
  const host = window.location.hostname;
  return host.includes('github.io') || window.location.protocol === 'file:';
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const base = getApiBase();
  const res = await fetch(`${base}${url}`, {
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

  const contentType = res.headers.get('content-type');
  if (contentType && !contentType.includes('application/json')) {
    throw new Error(`Expected JSON but got ${contentType}`);
  }

  return res.json();
}

async function withFallback<T>(remoteCall: () => Promise<T>, localCall: () => Promise<T>): Promise<T> {
  if (isStaticOrGhPages()) {
    return localCall();
  }
  try {
    return await remoteCall();
  } catch (err) {
    console.warn('[GATE Offline Fallback] Backend request failed, using browser local storage:', err);
    return localCall();
  }
}

export const api = {
  // Mode helpers
  isOfflineMode: () => isStaticOrGhPages(),

  // Settings
  getSettings: () => withFallback(() => fetchJson<UserSettings>('/settings/'), () => localStore.getSettings()),
  updateSettings: (payload: Partial<UserSettings>) =>
    withFallback(
      () =>
        fetchJson<UserSettings>('/settings/', {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      () => localStore.updateSettings(payload)
    ),

  // Syllabus
  getSubjects: () => withFallback(() => fetchJson<Subject[]>('/syllabus/subjects'), () => localStore.getSubjects()),
  getSyllabusTree: () => withFallback(() => fetchJson<SubjectTreeItem[]>('/syllabus/tree'), () => localStore.getSyllabusTree()),
  getTopicDetail: (topicId: number) => withFallback(() => fetchJson<any>(`/syllabus/topics/${topicId}`), () => localStore.getTopicDetail(topicId)),
  updateTopic: (topicId: number, payload: Partial<Topic> & { subtopics?: any[] }) =>
    withFallback(
      () =>
        fetchJson<Topic>(`/syllabus/topics/${topicId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      () => localStore.updateTopic(topicId, payload)
    ),
  reviseTopic: (topicId: number, confidence: string, notes?: string) =>
    withFallback(
      () =>
        fetchJson<any>(`/syllabus/topics/${topicId}/revise`, {
          method: 'POST',
          body: JSON.stringify({ confidence, notes }),
        }),
      () => localStore.reviseTopic(topicId, confidence, notes)
    ),
  getRevisionMatrix: () => withFallback(() => fetchJson<RevisionMatrixResponse>('/syllabus/revisions'), () => localStore.getRevisionMatrix()),

  // Planner & Tasks
  getWorkItems: (params?: { date?: string; start_date?: string; end_date?: string; status?: string }) => {
    return withFallback(
      () => {
        const query = new URLSearchParams(params as Record<string, string>).toString();
        return fetchJson<WorkItem[]>(`/planner/items?${query}`);
      },
      () => localStore.getWorkItems(params)
    );
  },
  getTodayQueue: (date?: string) =>
    withFallback(
      () =>
        fetchJson<{
          date: string;
          items: WorkItem[];
          next_activity?: WorkItem | null;
          overdue_count: number;
          overdue_items: WorkItem[];
        }>(`/planner/today${date ? `?date=${date}` : ''}`),
      () => localStore.getTodayQueue(date)
    ),
  getBacklog: () => withFallback(() => fetchJson<WorkItem[]>('/planner/backlog'), () => localStore.getBacklog()),
  createWorkItem: (payload: Partial<WorkItem>) =>
    withFallback(
      () =>
        fetchJson<WorkItem>('/planner/items', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createWorkItem(payload)
    ),
  updateWorkItem: (id: string, payload: Partial<WorkItem>) =>
    withFallback(
      () =>
        fetchJson<WorkItem>(`/planner/items/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      () => localStore.updateWorkItem(id, payload)
    ),
  deferWorkItem: (id: string, target_date?: string) =>
    withFallback(
      () =>
        fetchJson<WorkItem>(`/planner/items/${id}/defer`, {
          method: 'POST',
          body: JSON.stringify({ target_date }),
        }),
      () => localStore.deferWorkItem(id, target_date)
    ),
  generatePlan: (startDate?: string, targetDate?: string) =>
    withFallback(
      () =>
        fetchJson<{ status: string; message: string; created_count: number }>('/planner/generate-plan', {
          method: 'POST',
          body: JSON.stringify({ start_date: startDate, target_date: targetDate }),
        }),
      () => localStore.generatePlan(startDate, targetDate)
    ),
  reflowBacklog: (targetStartDate?: string) =>
    withFallback(
      () =>
        fetchJson<{ status: string; message: string; reflowed_count: number }>('/planner/reflow-backlog', {
          method: 'POST',
          body: JSON.stringify({ target_start_date: targetStartDate }),
        }),
      () => localStore.reflowBacklog(targetStartDate)
    ),

  // Study Sessions
  getStudySessions: (limit: number = 20) =>
    withFallback(
      () => fetchJson<StudySession[]>(`/sessions/?limit=${limit}`),
      () => localStore.getStudySessions(limit)
    ),
  createStudySession: (payload: Partial<StudySession>) =>
    withFallback(
      () =>
        fetchJson<StudySession>('/sessions/', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createStudySession(payload)
    ),

  // Intelligent Interaction Engine
  getMorningCheckin: (date?: string) =>
    withFallback(
      () => fetchJson<any>(`/interactions/morning-checkin${date ? `?date=${date}` : ''}`),
      () => localStore.getMorningCheckin(date)
    ),
  submitMorningCheckin: (date: string, answers: any) =>
    withFallback(
      () =>
        fetchJson<any>('/interactions/morning-checkin', {
          method: 'POST',
          body: JSON.stringify({ interaction_date: date, answers }),
        }),
      () => localStore.submitMorningCheckin(date, answers)
    ),
  getEveningReview: (date?: string) =>
    withFallback(
      () => fetchJson<any>(`/interactions/evening-review${date ? `?date=${date}` : ''}`),
      () => localStore.getEveningReview(date)
    ),
  submitEveningReview: (date: string, answers: any) =>
    withFallback(
      () =>
        fetchJson<any>('/interactions/evening-review', {
          method: 'POST',
          body: JSON.stringify({ interaction_date: date, answers }),
        }),
      () => localStore.submitEveningReview(date, answers)
    ),
  submitTaskCompletion: (payload: {
    work_item_id: string;
    confidence_rating: string;
    practiced_questions: boolean;
    questions_count?: number;
    session_id?: string;
  }) =>
    withFallback(
      () =>
        fetchJson<any>('/interactions/task-completion', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.submitTaskCompletion(payload)
    ),
  getInteractionHistory: () => withFallback(() => fetchJson<any[]>('/interactions/history'), () => localStore.getInteractionHistory()),

  // Mock Tests
  getMockTests: () => withFallback(() => fetchJson<MockTest[]>('/mocks/'), () => localStore.getMockTests()),
  getMockTestDetail: (id: string) => withFallback(() => fetchJson<any>(`/mocks/${id}`), () => localStore.getMockTestDetail(id)),
  createMockTest: (payload: any) =>
    withFallback(
      () =>
        fetchJson<MockTest>('/mocks/', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createMockTest(payload)
    ),

  // Mistake Vault
  getMistakes: (params?: { subject_id?: number; topic_id?: number; error_category?: string; is_resolved?: boolean }) =>
    withFallback(
      () => {
        const query = new URLSearchParams(params as any).toString();
        return fetchJson<MistakeLog[]>(`/mistakes/?${query}`);
      },
      () => localStore.getMistakes(params)
    ),
  createMistake: (payload: Partial<MistakeLog>) =>
    withFallback(
      () =>
        fetchJson<MistakeLog>('/mistakes/', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createMistake(payload)
    ),
  resolveMistake: (id: string, is_resolved: boolean = true) =>
    withFallback(
      () =>
        fetchJson<MistakeLog>(`/mistakes/${id}/resolve`, {
          method: 'PUT',
          body: JSON.stringify({ is_resolved }),
        }),
      () => localStore.resolveMistake(id, is_resolved)
    ),

  // Study & Formula Journal
  getJournalEntries: (params?: { entry_type?: string; subject_id?: number; topic_id?: number; is_pinned?: boolean; search?: string }) =>
    withFallback(
      () => {
        const query = new URLSearchParams(params as any).toString();
        return fetchJson<JournalEntry[]>(`/journal/?${query}`);
      },
      () => localStore.getJournalEntries(params)
    ),
  createJournalEntry: (payload: Partial<JournalEntry> & { tags?: string[] }) =>
    withFallback(
      () =>
        fetchJson<JournalEntry>('/journal/', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => localStore.createJournalEntry(payload)
    ),
  updateJournalEntry: (id: string, payload: Partial<JournalEntry> & { tags?: string[] }) =>
    withFallback(
      () =>
        fetchJson<JournalEntry>(`/journal/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }),
      () => localStore.updateJournalEntry(id, payload)
    ),
  deleteJournalEntry: (id: string) =>
    withFallback(
      () =>
        fetchJson<{ status: string }>(`/journal/${id}`, {
          method: 'DELETE',
        }),
      () => localStore.deleteJournalEntry(id)
    ),

  // Analytics & Intelligence
  getDashboardAnalytics: () => withFallback(() => fetchJson<DashboardKPIs>('/analytics/dashboard'), () => localStore.getDashboardAnalytics()),
  getComprehensiveAnalytics: () => withFallback(() => fetchJson<ComprehensiveAnalytics>('/analytics/comprehensive'), () => localStore.getComprehensiveAnalytics()),

  // Data Management
  exportFullDatabase: () => withFallback(() => fetchJson<any>('/data/export'), () => localStore.exportFullDatabase()),
  importFullDatabase: (data: any) =>
    withFallback(
      () =>
        fetchJson<any>('/data/import', {
          method: 'POST',
          body: JSON.stringify(data),
        }),
      () => localStore.importFullDatabase(data)
    ),
  resetPreparation: () =>
    withFallback(
      () =>
        fetchJson<any>('/data/reset', {
          method: 'POST',
        }),
      () => localStore.resetPreparation()
    ),
};
