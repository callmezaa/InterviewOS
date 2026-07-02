import { nanoid } from 'nanoid';
import type { UserSession } from '../store/useInterviewStore';

export function createGuestUser(): UserSession {
  return {
    id: `guest_${nanoid(12)}`,
    email: 'guest@tryinterviewos.com',
    name: 'Guest Explorer',
    role: 'CANDIDATE',
    plan: 'FREE',
    isGuest: true,
  };
}

export function isGuest(user: UserSession | null): boolean {
  return user?.isGuest === true;
}
