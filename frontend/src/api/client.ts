import type {
  UserProfile,
  ChecklistTask,
  ChecklistSummary,
  AbsenceRequest,
  AccessItem,
  CodeReviewResponse,
  GlossaryTerm,
  UserGamificationProfile
} from '../types';

const API_BASE = '';

export async function fetchWithAuth(url: string, activeUserId: string, options: RequestInit = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-User-Id': activeUserId,
    ...(options.headers || {})
  };
  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.detail || `HTTP Error ${res.status}`);
  }
  return res.json();
}

export const api = {
  getUsers: (activeUserId: string): Promise<UserProfile[]> => 
    fetchWithAuth('/api/auth/users', activeUserId),

  getMe: (activeUserId: string): Promise<UserProfile> => 
    fetchWithAuth('/api/auth/me', activeUserId),

  getChecklistTasks: (activeUserId: string, period?: string, category?: string): Promise<ChecklistTask[]> => {
    const params = new URLSearchParams();
    if (period && period !== 'all') params.append('period', period);
    if (category && category !== 'all') params.append('category', category);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/api/checklist${query}`, activeUserId);
  },

  getChecklistSummary: (activeUserId: string): Promise<ChecklistSummary> => 
    fetchWithAuth('/api/checklist/summary', activeUserId),

  updateTaskStatus: (activeUserId: string, taskId: string, status: string): Promise<ChecklistTask> => 
    fetchWithAuth(`/api/checklist/${taskId}/status?status=${status}`, activeUserId, { method: 'PATCH' }),

  getAbsences: (activeUserId: string): Promise<AbsenceRequest[]> => 
    fetchWithAuth('/api/absences', activeUserId),

  createAbsence: (activeUserId: string, payload: { start_date: string; end_date?: string; reason: string; absence_type?: string }): Promise<AbsenceRequest> => 
    fetchWithAuth('/api/absences', activeUserId, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  approveAbsence: (activeUserId: string, absenceId: string): Promise<AbsenceRequest> => 
    fetchWithAuth(`/api/absences/${absenceId}/approve`, activeUserId, { method: 'POST' }),

  rejectAbsence: (activeUserId: string, absenceId: string, reason?: string): Promise<AbsenceRequest> => 
    fetchWithAuth(`/api/absences/${absenceId}/reject`, activeUserId, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || 'Отклонено наставником' })
    }),

  getAccessList: (activeUserId: string): Promise<AccessItem[]> => 
    fetchWithAuth('/api/access', activeUserId),

  requestAccess: (activeUserId: string, systemKey: string, justification: string): Promise<AccessItem> => 
    fetchWithAuth('/api/access', activeUserId, {
      method: 'POST',
      body: JSON.stringify({ system_key: systemKey, justification })
    }),

  grantAccess: (activeUserId: string, systemKey: string): Promise<AccessItem> => 
    fetchWithAuth(`/api/access/${systemKey}/grant`, activeUserId, { method: 'POST' }),

  sendChatMessage: (activeUserId: string, message: string): Promise<{
    reply: string;
    action_type?: string;
    action_payload?: any;
    suggested_chips?: string[];
    sources?: string[];
  }> => 
    fetchWithAuth('/api/chat', activeUserId, {
      method: 'POST',
      body: JSON.stringify({ message })
    }),

  getAnalyticsSummary: (activeUserId: string) => 
    fetchWithAuth('/api/analytics/summary', activeUserId),

  logEvent: (activeUserId: string, eventName: string, properties: any = {}) => 
    fetchWithAuth('/api/analytics/event', activeUserId, {
      method: 'POST',
      body: JSON.stringify({ event_name: eventName, user_id: activeUserId, properties })
    }),

  // Feature 1: Pre-flight Code Review
  analyzeCode: (activeUserId: string, code: string, language: string = 'go'): Promise<CodeReviewResponse> =>
    fetchWithAuth('/api/code-review/analyze', activeUserId, {
      method: 'POST',
      body: JSON.stringify({ code, language })
    }),

  // Feature 12: Glossary
  getGlossary: (activeUserId: string, category?: string, search?: string): Promise<GlossaryTerm[]> => {
    const params = new URLSearchParams();
    if (category && category !== 'Все') params.append('category', category);
    if (search) params.append('search', search);
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchWithAuth(`/api/glossary${query}`, activeUserId);
  },

  getGlossaryCategories: (activeUserId: string): Promise<string[]> =>
    fetchWithAuth('/api/glossary/categories', activeUserId),

  // Feature: Gamification
  getGamificationProfile: (activeUserId: string): Promise<UserGamificationProfile> =>
    fetchWithAuth('/api/gamification/profile', activeUserId)
};

// Named exports for convenient direct imports
export const analyzeCode = (code: string, language: string = 'go', userId: string = 'intern_1') =>
  api.analyzeCode(userId, code, language);

export const getGlossary = (category?: string, search?: string, userId: string = 'intern_1') =>
  api.getGlossary(userId, category, search);

export const getGlossaryCategories = (userId: string = 'intern_1') =>
  api.getGlossaryCategories(userId);

export const getGamificationProfile = (userId: string = 'intern_1') =>
  api.getGamificationProfile(userId);
