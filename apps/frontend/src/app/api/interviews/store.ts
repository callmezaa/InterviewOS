import type { InterviewDetails } from '@/store/useInterviewStore';

// ponytail: use globalThis to persist across Next.js module re-evaluations (Turbopack)
const g = globalThis as unknown as { __interviews?: InterviewDetails[] };
if (!g.__interviews) g.__interviews = [];
const interviews = g.__interviews;

export function getInterviews(): InterviewDetails[] {
  return interviews;
}

export function addInterview(iv: InterviewDetails): void {
  interviews.push(iv);
}

export function deleteInterview(id: string): boolean {
  const idx = interviews.findIndex((iv) => iv.id === id);
  if (idx === -1) return false;
  interviews.splice(idx, 1);
  return true;
}

export function rescheduleInterview(
  id: string,
  scheduledTime: string,
): InterviewDetails | null {
  const iv = interviews.find((iv) => iv.id === id);
  if (!iv) return null;
  iv.scheduledTime = scheduledTime;
  return iv;
}

export function updateInterviewStatus(
  id: string,
  status: InterviewDetails['status'],
): InterviewDetails | null {
  const iv = interviews.find((iv) => iv.id === id);
  if (!iv) return null;
  iv.status = status;
  return iv;
}
