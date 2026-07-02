import { create } from 'zustand';
import { playSound, type SoundType } from '../lib/sounds';
import { triggerConfetti } from '../lib/confetti';
import { useSoundStore } from './useSoundStore';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration: number;
  action?: ToastAction;
}

interface ToastStore {
  toasts: ToastItem[];
  add: (toast: Omit<ToastItem, 'id'>) => void;
  remove: (id: string) => void;
  updateAction: (id: string, action: ToastAction | undefined) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2, 10);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));

    if (toast.type === 'success') {
      triggerConfetti();
    }

    const { enabled, volume } = useSoundStore.getState();
    if (enabled) {
      const soundMap: Record<ToastType, SoundType> = {
        success: 'success',
        error: 'error',
        info: 'info',
        warning: 'warning',
      };
      playSound(soundMap[toast.type], volume);
    }
  },
  updateAction: (id, action) => {
    set((s) => ({
      toasts: s.toasts.map((t) => (t.id === id ? { ...t, action } : t)),
    }));
  },
  remove: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

// Imperative helpers — call from anywhere, no hook required
type ToastOpts = { duration?: number; action?: ToastAction };

export const toast = {
  success: (title: string, message?: string, opts?: number | ToastOpts) =>
    useToastStore.getState().add({
      type: 'success', title, message,
      duration: typeof opts === 'number' ? opts : opts?.duration ?? 4000,
      action: typeof opts === 'number' ? undefined : opts?.action,
    }),
  error: (title: string, message?: string, opts?: number | ToastOpts) =>
    useToastStore.getState().add({
      type: 'error', title, message,
      duration: typeof opts === 'number' ? opts : opts?.duration ?? 5000,
      action: typeof opts === 'number' ? undefined : opts?.action,
    }),
  info: (title: string, message?: string, opts?: number | ToastOpts) =>
    useToastStore.getState().add({
      type: 'info', title, message,
      duration: typeof opts === 'number' ? opts : opts?.duration ?? 4000,
      action: typeof opts === 'number' ? undefined : opts?.action,
    }),
  warning: (title: string, message?: string, opts?: number | ToastOpts) =>
    useToastStore.getState().add({
      type: 'warning', title, message,
      duration: typeof opts === 'number' ? opts : opts?.duration ?? 4500,
      action: typeof opts === 'number' ? undefined : opts?.action,
    }),
};
