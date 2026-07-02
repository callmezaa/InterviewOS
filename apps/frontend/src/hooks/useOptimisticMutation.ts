'use client';

import { useState, useCallback, useRef } from 'react';
import { optimisticMutate, type OptimisticUndoConfig } from '../lib/optimistic';

interface UseOptimisticMutationOptions<TVars, TRes> {
  mutationFn: (vars: TVars) => Promise<TRes>;
  optimisticUpdate: (vars: TVars) => void;
  rollback: (vars: TVars) => void;
  undoConfig?: (vars: TVars, res: TRes) => OptimisticUndoConfig;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (res: TRes, vars: TVars) => void;
  onError?: (err: Error, vars: TVars) => void;
}

export function useOptimisticMutation<TVars, TRes>(
  options: UseOptimisticMutationOptions<TVars, TRes>,
) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const latestVarsRef = useRef<TVars | null>(null);

  const mutate = useCallback(
    async (vars: TVars) => {
      setIsPending(true);
      setError(null);
      latestVarsRef.current = vars;

      const result = await optimisticMutate<TRes>(
        () => options.mutationFn(vars),
        {
          optimisticUpdate: () => options.optimisticUpdate(vars),
          rollback: () => options.rollback(vars),
          undoConfig: undefined,
          successMessage: options.successMessage,
          errorMessage: options.errorMessage,
          onSuccess: (res) => {
            options.onSuccess?.(res, vars);
          },
          onError: (err) => {
            setError(err);
            options.onError?.(err, vars);
          },
        },
      );

      setIsPending(false);
      return result;
    },
    [options],
  );

  const reset = useCallback(() => {
    setError(null);
    setIsPending(false);
  }, []);

  return { mutate, isPending, error, reset };
}
