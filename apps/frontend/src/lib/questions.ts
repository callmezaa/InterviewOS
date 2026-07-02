import { API_URL } from './config';
import type { PaginatedQuestions, QuestionDetail, QuestionSummary, QuestionCategory } from '@interviewos/shared';

interface FetchOptions {
  signal?: AbortSignal;
}

async function apiFetch<T>(path: string, options?: RequestInit & FetchOptions): Promise<T> {
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

export interface QuestionFilters {
  search?: string;
  difficulty?: string;
  source?: string;
  categoryId?: string;
  tag?: string;
  language?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
}

export async function fetchQuestions(filters: QuestionFilters = {}, signal?: AbortSignal): Promise<PaginatedQuestions> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== '') params.set(key, String(val));
  });
  return apiFetch<PaginatedQuestions>(`/questions?${params.toString()}`, { signal });
}

export async function fetchQuestion(id: string, signal?: AbortSignal): Promise<QuestionDetail> {
  return apiFetch<QuestionDetail>(`/questions/${id}`, { signal });
}

export async function createQuestion(data: Record<string, unknown>): Promise<QuestionDetail> {
  return apiFetch<QuestionDetail>('/questions', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateQuestion(id: string, data: Record<string, unknown>): Promise<QuestionDetail> {
  return apiFetch<QuestionDetail>(`/questions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteQuestion(id: string): Promise<void> {
  await apiFetch<void>(`/questions/${id}`, { method: 'DELETE' });
}

export async function voteQuestion(id: string, value: 1 | -1): Promise<{ vote: 1 | -1 | null }> {
  return apiFetch<{ vote: 1 | -1 | null }>(`/questions/${id}/vote`, {
    method: 'POST',
    body: JSON.stringify({ value }),
  });
}

export async function toggleBookmark(id: string): Promise<{ bookmarked: boolean }> {
  return apiFetch<{ bookmarked: boolean }>(`/questions/${id}/bookmark`, {
    method: 'POST',
  });
}

export async function fetchMyQuestions(page = 1, limit = 20): Promise<PaginatedQuestions> {
  return apiFetch<PaginatedQuestions>(`/questions/my?page=${page}&limit=${limit}`);
}

export async function fetchBookmarks(page = 1, limit = 20): Promise<PaginatedQuestions> {
  return apiFetch<PaginatedQuestions>(`/questions/bookmarks?page=${page}&limit=${limit}`);
}

export async function fetchCategories(): Promise<QuestionCategory[]> {
  return apiFetch<QuestionCategory[]>('/questions/categories');
}

export async function exportQuestions(format: 'json' | 'csv' = 'json'): Promise<void> {
  const res = await fetch(`${API_URL}/questions/export?format=${format}`, {
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Export failed: ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const ext = format === 'csv' ? 'csv' : 'json';
  a.download = `questions-export-${new Date().toISOString().slice(0, 10)}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function importQuestions(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/questions/import`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Import failed: ${res.status}`);
  }
  return res.json() as Promise<ImportResult>;
}
