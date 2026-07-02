import { API_URL } from './config';
import { authFetch } from './authFetch';

export type ActivityType =
  | 'interview_scheduled'
  | 'interview_active'
  | 'interview_completed'
  | 'interview_cancelled'
  | 'interview_rescheduled'
  | 'feedback_ready'
  | 'account_created'
  | 'guest_converted'
  | 'share_created';

export interface ActivityItem {
  id: string;
  userId: string;
  type: ActivityType;
  title: string;
  description: string | null;
  interviewId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  interview: { id: string; title: string; status: string } | null;
}

export interface PaginatedActivities {
  data: ActivityItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ActivityFilters {
  page?: number;
  limit?: number;
  type?: ActivityType;
  before?: string;
}

export async function fetchActivities(filters: ActivityFilters = {}): Promise<PaginatedActivities> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== undefined && val !== '') params.set(key, String(val));
  });
  const res = await authFetch(`${API_URL}/activities?${params.toString()}`, {});
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `Failed to fetch activities: ${res.status}`);
  }
  return res.json() as Promise<PaginatedActivities>;
}
