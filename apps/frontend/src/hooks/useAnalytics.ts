import { useCallback } from 'react';
import { usePostHog } from '../components/PostHogProvider';

export function useAnalytics() {
  const { capture } = usePostHog();

  const track = useCallback(
    (event: string, properties?: Record<string, unknown>) => {
      capture(event, properties);
    },
    [capture],
  );

  return { track };
}
