'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore, ToastItem, ToastType } from '../../store/useToastStore';
import { useReducedMotion } from '../../lib/motion';

// ── Config per type ──────────────────────────────────────────────────────────
const CONFIG: Record<ToastType, {
  icon: React.ElementType;
  iconClass: string;
  barClass: string;
  borderClass: string;
}> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-primary-on-dark',
    barClass: 'bg-primary',
    borderClass: 'border-primary/20',
  },
  info: {
    icon: Info,
    iconClass: 'text-primary-on-dark',
    barClass: 'bg-primary',
    borderClass: 'border-primary/20',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-primary-on-dark',
    barClass: 'bg-primary',
    borderClass: 'border-primary/20',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-primary-on-dark',
    barClass: 'bg-primary',
    borderClass: 'border-primary/20',
  },
};

// ── Single Toast ─────────────────────────────────────────────────────────────
function Toast({ toast }: { toast: ToastItem }) {
  const remove = useToastStore((s) => s.remove);
  const reduced = useReducedMotion();
  const { icon: Icon, iconClass, barClass, borderClass } = CONFIG[toast.type];

  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, remove]);

  return (
    <motion.div
      layout={!reduced}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      initial={{ opacity: 0, x: 56, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 56, scale: 0.95 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      drag={reduced ? undefined : "x"}
      dragSnapToOrigin={reduced ? undefined : true}
      onDragEnd={reduced ? undefined : (_, info) => {
        if (info.offset.x > 80) remove(toast.id);
      }}
      whileDrag={reduced ? undefined : { scale: 1.02, boxShadow: '0 12px 40px rgba(0,0,0,0.6)' }}
      className={`relative w-[360px] overflow-hidden rounded-lg border bg-surface-tile-2/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${reduced ? '' : 'cursor-grab active:cursor-grabbing'} ${borderClass} ${toast.action ? 'border-primary/30' : ''}`}
    >
      {/* Content */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconClass}`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white leading-snug">{toast.title}</p>
          {toast.message && (
            <p className="text-[12px] text-body-muted/60 mt-0.5 leading-relaxed">{toast.message}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {toast.action && (
            <button
              onClick={() => { toast.action!.onClick(); remove(toast.id); }}
              className="px-3 py-1.5 text-[11px] font-semibold rounded-md border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 hover:border-primary/30 transition-all cursor-pointer"
            >
              {toast.action.label}
            </button>
          )}
          <button
            onClick={() => remove(toast.id)}
            className="text-body-muted/50 hover:text-white transition-colors duration-150 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-[2px] ${toast.action ? 'bg-gradient-to-r from-primary to-primary-on-dark' : barClass}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

// ── Toaster Container ─────────────────────────────────────────────────────────
export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-2.5 items-end pointer-events-none"
    >
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
