'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface ConfirmModalProps {
  confirmAction: 'evaluate' | 'exit' | null;
  evaluating: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ confirmAction, evaluating, onCancel, onConfirm }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !evaluating) onCancel();
    },
    [onCancel, evaluating],
  );

  useEffect(() => {
    if (confirmAction) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [confirmAction, handleKeyDown]);

  return (
    <AnimatePresence>
      {confirmAction && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-desc"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px] bg-surface-tile-2 border border-white/[0.06] rounded-lg p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col gap-5"
          >
            <div className="flex flex-col gap-2">
              <h3 id="confirm-modal-title" className="font-display font-semibold text-h4 text-white">
                {confirmAction === 'evaluate' ? 'Evaluate & End Session?' : 'Exit Interview Room?'}
              </h3>
              <p id="confirm-modal-desc" className="text-body-muted/60 text-[13px] leading-relaxed">
                {confirmAction === 'evaluate'
                  ? 'This will immediately terminate the collaborative workspace and execute the post-session AI review. This action cannot be undone.'
                  : 'Are you sure you want to exit the call? You can rejoin later as long as the session is not completed.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="flex-1 border border-white/[0.06] hover:bg-white/[0.04]"
              >
                Cancel
              </Button>
              <Button
                variant={confirmAction === 'evaluate' ? 'primary' : 'ghost'}
                onClick={onConfirm}
                disabled={evaluating}
                className="flex-1 py-2 text-[13px]"
              >
                {confirmAction === 'evaluate' ? (evaluating ? 'Evaluating...' : 'End & Evaluate') : 'Yes, Exit'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
