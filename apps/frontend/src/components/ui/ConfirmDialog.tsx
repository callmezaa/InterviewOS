'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import { Button } from './Button';
import { useFocusTrap } from '../../hooks/useFocusTrap';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const variantConfig = {
  danger: {
    icon: Trash2,
    iconBg: 'bg-red-500/10',
    iconColor: 'text-red-400',
    iconBorder: 'border-red-500/20',
    buttonVariant: 'danger' as const,
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-500/10',
    iconColor: 'text-amber-400',
    iconBorder: 'border-amber-500/20',
    buttonVariant: 'danger' as const,
  },
  info: {
    icon: Info,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    iconBorder: 'border-primary/20',
    buttonVariant: 'primary' as const,
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const dialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  icon,
}) => {
  const dialogRef = useFocusTrap(isOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onClose();
    },
    [onClose, isLoading],
  );

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const cfg = variantConfig[variant];
  const IconComponent = cfg.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            key="confirm-dialog-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            key="confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            variants={dialogVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[400px] bg-surface-tile-2 border border-white/[0.06] rounded-lg shadow-[var(--shadow-dropdown)] overflow-hidden"
          >
            <div className="flex flex-col gap-5 p-6">
              <div className="flex items-start gap-4">
                {icon ? (
                  <div className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center">{icon}</div>
                ) : (
                  <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center border ${cfg.iconBg} ${cfg.iconColor} ${cfg.iconBorder}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 id="confirm-dialog-title" className="font-display font-semibold text-[17px] text-white leading-snug">
                    {title}
                  </h3>
                  <p id="confirm-dialog-desc" className="mt-1.5 text-[13px] text-body-muted/60 leading-relaxed">
                    {description}
                  </p>
                </div>
                <button
                  onClick={isLoading ? undefined : onClose}
                  className="shrink-0 p-1 rounded-lg text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-all"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 bg-white/[0.02] border-t border-white/[0.06]">
              <Button
                variant="ghost"
                onClick={onClose}
                disabled={isLoading}
                className="border border-white/[0.06] hover:bg-white/[0.04] text-[13px]"
              >
                {cancelText}
              </Button>
              <Button
                variant={cfg.buttonVariant}
                onClick={onConfirm}
                disabled={isLoading}
                className="text-[13px]"
              >
                {isLoading ? `${confirmText}...` : confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
