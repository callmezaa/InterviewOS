import { create } from 'zustand';
import { toast } from './useToastStore';

export interface UndoAction {
  id: string;
  type: string;
  label: string;
  description: string;
  undo: () => void | Promise<void>;
  timestamp: number;
}

interface ActionHistoryState {
  actions: UndoAction[];
  pushAction: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  executeUndo: (id: string) => void;
  dismissAction: (id: string) => void;
  clearAll: () => void;
}

let actionCounter = 0;

export const useActionHistory = create<ActionHistoryState>((set, get) => ({
  actions: [],

  pushAction: (action) => {
    const id = `undo-${++actionCounter}`;
    const entry: UndoAction = { ...action, id, timestamp: Date.now() };

    set((s) => ({ actions: [...s.actions, entry] }));

    toast.success(action.label, action.description, {
      duration: 8000,
      action: {
        label: 'Undo',
        onClick: () => {
          get().executeUndo(id);
        },
      },
    });
  },

  executeUndo: async (id) => {
    const entry = get().actions.find((a) => a.id === id);
    if (!entry) return;

    try {
      await entry.undo();
      toast.info('Undone', `"${entry.label}" has been reverted.`);
    } catch {
      toast.error('Undo failed', `Could not revert "${entry.label}". Please try manually.`);
    }

    set((s) => ({ actions: s.actions.filter((a) => a.id !== id) }));
  },

  dismissAction: (id) => {
    set((s) => ({ actions: s.actions.filter((a) => a.id !== id) }));
  },

  clearAll: () => {
    set({ actions: [] });
  },
}));
