import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance — sample 25% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.25 : 0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 0,

  // Session replay — 10% of sessions, 100% on error
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.httpClientIntegration(),
    Sentry.reportingObserverIntegration(),
  ],

  // Ignore known non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Network request failed',
    'Failed to fetch',
    'Loading chunk',
    'Request aborted',
    'AbortError',
    'canceled',
    'Cancelled',
  ],

  denyUrls: [
    /chrome-extension:\/\//i,
    /safari-extension:\/\//i,
    /moz-extension:\/\//i,
  ],

  beforeSend(event) {
    if (process.env.NODE_ENV === 'development') return null;
    return event;
  },
});
