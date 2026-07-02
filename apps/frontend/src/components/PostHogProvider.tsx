'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import posthog from 'posthog-js';
import { useInterviewStore } from '../store/useInterviewStore';

interface PostHogContextValue {
  capture: (event: string, properties?: Record<string, unknown>) => void;
}

const PostHogContext = createContext<PostHogContextValue>({
  capture: () => {},
});

export function usePostHog() {
  return useContext(PostHogContext);
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useInterviewStore((s) => s.user);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

    if (!key) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PostHog] Skipped — no NEXT_PUBLIC_POSTHOG_KEY set');
      }
      initialized.current = true;
      return;
    }

    posthog.init(key, {
      api_host: host,
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: true,
      loaded: () => {
        if (process.env.NODE_ENV === 'development') {
          posthog.debug();
        }
      },
    });

    initialized.current = true;
  }, []);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.capture('$pageview', { $current_url: pathname });
  }, [pathname]);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    if (user) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
      });
    } else {
      posthog.reset();
    }
  }, [user?.id, user?.email, user?.name, user?.role]);

  const capture = React.useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.capture(event, properties);
      }
    },
    [],
  );

  return (
    <PostHogContext.Provider value={{ capture }}>
      {children}
    </PostHogContext.Provider>
  );
}
