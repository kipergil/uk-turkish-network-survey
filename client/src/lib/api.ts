import type {
  CategoryAnswersResponse,
  CategoryResultsResponse,
  CreateOrResumeSubmissionRequest,
  EditionResultsOverview,
  ResumeByCodeRequest,
  SaveCategoryAnswersRequest,
  SendRecoveryEmailRequest,
  StatsResponse,
  SubmissionStateResponse,
  SubscribeRequest,
} from '@shared/api-types';

const API_BASE = (import.meta.env.VITE_API_BASE_URL as string) || '/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  createOrResumeSubmission: (body: CreateOrResumeSubmissionRequest) =>
    request<SubmissionStateResponse>('/submissions', { method: 'POST', body: JSON.stringify(body) }),

  saveCategoryAnswers: (token: string, body: SaveCategoryAnswersRequest) =>
    request<SubmissionStateResponse>(`/submissions/${token}/answers`, { method: 'POST', body: JSON.stringify(body) }),

  getCategoryAnswers: (token: string, categoryId: string) =>
    request<CategoryAnswersResponse>(`/submissions/${token}/categories/${categoryId}/answers`),

  resumeByCode: (body: ResumeByCodeRequest) =>
    request<SubmissionStateResponse>('/submissions/resume', { method: 'POST', body: JSON.stringify(body) }),

  sendRecoveryEmail: (token: string, body: SendRecoveryEmailRequest) =>
    request<{ ok: true }>(`/submissions/${token}/recovery-email`, { method: 'POST', body: JSON.stringify(body) }),

  subscribe: (body: SubscribeRequest) =>
    request<{ ok: true }>('/subscribers', { method: 'POST', body: JSON.stringify(body) }),

  stats: (editionId: string) => request<StatsResponse>(`/stats/${editionId}`),

  editionResults: (editionId: string) => request<EditionResultsOverview>(`/results/${editionId}`),

  categoryResults: (editionId: string, categorySlug: string) =>
    request<CategoryResultsResponse>(`/results/${editionId}/${categorySlug}`),
};
