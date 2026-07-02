'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
}

interface EmptyStateProps {
  /** Premium SVG illustration (shown at large size) */
  illustration?: React.ReactNode;
  /** Simple icon (shown in a circle, used for compact/inline states) */
  icon?: React.ReactNode;
  title?: string;
  description: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  compact?: boolean;
}

export function EmptyState({
  illustration,
  icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={`flex flex-col items-center justify-center text-center w-full h-full ${
        compact ? 'min-h-[120px] gap-2.5 py-6 px-4' : 'min-h-[200px] gap-4 py-12 px-6'
      }`}
    >
      {/* Premium illustration (full-size) */}
      {illustration && (
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 4,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'reverse',
          }}
          className={`relative flex items-center justify-center select-none pointer-events-none text-primary-on-dark/20 ${
            compact ? 'w-[100px] h-[80px] mb-1' : 'w-[160px] h-[128px] mb-2'
          }`}
        >
          <div className={compact ? 'scale-[0.55] origin-center' : ''}>
            {illustration}
          </div>
        </motion.div>
      )}

      {/* Simple icon fallback */}
      {!illustration && icon && (
        <div
          className={`rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-body-muted/40 ${
            compact ? 'w-8 h-8' : 'w-10 h-10'
          }`}
        >
          {icon}
        </div>
      )}

      {title && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: EASE }}
          className={`font-display font-semibold text-white ${
            compact ? 'text-[13px]' : 'text-[17px]'
          }`}
        >
          {title}
        </motion.p>
      )}

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: EASE }}
        className={`text-body-muted/45 leading-relaxed max-w-[280px] ${
          compact ? 'text-[12px]' : 'text-[13px]'
        }`}
      >
        {description}
      </motion.p>

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: EASE }}
          className={`flex items-center gap-3 ${compact ? 'mt-1' : 'mt-3'}`}
        >
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'ghost'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
