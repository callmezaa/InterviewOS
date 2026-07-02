import { init } from '@sentry/nextjs';

init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: !!process.env.SENTRY_DSN,

  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 0,

  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ],

  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') return null;
    return event;
  },
});
