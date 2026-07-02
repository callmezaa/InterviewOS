import { API_URL } from './config';

export interface RecordingItem {
  id: string;
  title: string;
  description: string | null;
  status: string;
  scheduledTime: string;
  recordingUrl: string | null;
  recordingSize: number | null;
  recordingDuration: number | null;
  recordingMimeType: string | null;
  participants: {
    role: string;
    user: { id: string; name: string; email: string };
  }[];
}

export async function fetchRecordings(): Promise<RecordingItem[]> {
  const res = await fetch(`${API_URL}/media/recordings`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch recordings');
  return res.json();
}

export async function deleteRecording(interviewId: string): Promise<void> {
  const res = await fetch(`${API_URL}/media/${interviewId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete recording');
}

export async function fetchRecordingUrl(interviewId: string): Promise<string | null> {
  const res = await fetch(`${API_URL}/media/${interviewId}/url`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url ?? null;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes) return 'Unknown';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDuration(seconds: number | null | undefined): string {
  if (!seconds) return 'Unknown';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
