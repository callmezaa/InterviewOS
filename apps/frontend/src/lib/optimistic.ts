import { toast } from '../store/useToastStore';
import { useActionHistory } from '../store/useActionHistoryStore';

export interface OptimisticUndoConfig {
  label: string;
  description: string;
  undo: () => void | Promise<void>;
}

export interface OptimisticOptions<TRes> {
  optimisticUpdate: () => void;
  rollback: () => void;
  undoConfig?: OptimisticUndoConfig;
  successMessage?: string;
  errorMessage?: string;
  onSuccess?: (res: TRes) => void;
  onError?: (err: Error) => void;
}

export async function optimisticMutate<TRes>(
  mutateFn: () => Promise<TRes>,
  options: OptimisticOptions<TRes>,
): Promise<TRes | undefined> {
  options.optimisticUpdate();

  try {
    const result = await mutateFn();

    if (options.undoConfig) {
      useActionHistory.getState().pushAction({
        type: 'optimistic',
        ...options.undoConfig,
      });
    }

    if (options.successMessage) {
      toast.success(options.successMessage, options.undoConfig?.description || '');
    }

    options.onSuccess?.(result);
    return result;
  } catch (err) {
    options.rollback();

    const error = err instanceof Error ? err : new Error(String(err));
    if (options.errorMessage) {
      toast.error(options.errorMessage, error.message);
    }

    options.onError?.(error);
    return undefined;
  }
}

export async function optimisticMutateWithUndo<TRes>(
  mutateFn: () => Promise<TRes>,
  options: Omit<OptimisticOptions<TRes>, 'undoConfig'> & { undoConfig: OptimisticUndoConfig },
): Promise<TRes | undefined> {
  return optimisticMutate(mutateFn, options);
}
