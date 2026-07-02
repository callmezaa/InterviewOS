import { API_URL } from './config';
import type { PaginatedTemplates, InterviewTemplate } from '@interviewos/shared';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface TemplateFilters {
  category?: string;
  source?: string;
  difficulty?: string;
  tag?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  limit?: number;
}

export async function fetchTemplates(filters: TemplateFilters = {}): Promise<PaginatedTemplates> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== '') params.set(key, String(val));
  });
  return apiFetch<PaginatedTemplates>(`/templates?${params.toString()}`);
}

export async function fetchTemplate(id: string): Promise<InterviewTemplate> {
  return apiFetch<InterviewTemplate>(`/templates/${id}`);
}

export async function createTemplate(data: Record<string, unknown>): Promise<InterviewTemplate> {
  return apiFetch<InterviewTemplate>('/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(id: string, data: Record<string, unknown>): Promise<InterviewTemplate> {
  return apiFetch<InterviewTemplate>(`/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiFetch(`/templates/${id}`, { method: 'DELETE' });
}

export async function voteTemplate(id: string, value: 1 | -1): Promise<{ vote: 1 | -1 | null }> {
  return apiFetch<{ vote: 1 | -1 | null }>(`/templates/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export async function toggleTemplateBookmark(id: string): Promise<{ bookmarked: boolean }> {
  return apiFetch<{ bookmarked: boolean }>(`/templates/${id}/bookmark`, {
    method: 'POST',
  });
}

export async function fetchMyTemplates(page = 1, limit = 20): Promise<PaginatedTemplates> {
  return apiFetch<PaginatedTemplates>(`/templates/my?page=${page}&limit=${limit}`);
}

export async function fetchTemplateBookmarks(page = 1, limit = 20): Promise<PaginatedTemplates> {
  return apiFetch<PaginatedTemplates>(`/templates/bookmarks?page=${page}&limit=${limit}`);
}
