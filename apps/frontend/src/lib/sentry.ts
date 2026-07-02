import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context?: {
  route?: string;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}) {
  Sentry.withScope((scope) => {
    if (context?.route) {
      scope.setTag('route', context.route);
    }
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }
    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}
