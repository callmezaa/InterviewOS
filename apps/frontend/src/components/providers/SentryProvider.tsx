'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import { useInterviewStore } from '../../store/useInterviewStore';

const APP_VERSION = '1.0.0';

export function SentryProvider({ children }: { children: React.ReactNode }) {
  const user = useInterviewStore((s) => s.user);

  useEffect(() => {
    Sentry.setTag('app_version', APP_VERSION);
    Sentry.setTag('app_name', 'interviewos');
  }, []);

  useEffect(() => {
    if (user?.id) {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.name,
      });
    } else {
      Sentry.setUser(null);
    }
  }, [user?.id, user?.email, user?.name]);

  return <>{children}</>;
}
