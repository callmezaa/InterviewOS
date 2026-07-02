import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cardVariants = {
  default:
    'bg-surface-tile-1/40 border border-white/[0.06] text-white',
  interactive:
    'bg-surface-tile-1/40 border border-white/[0.06] text-white cursor-pointer hover:bg-surface-tile-1/60 hover:border-white/[0.1]',
  elevated:
    'bg-surface-tile-2/95 border border-white/[0.06] text-white shadow-[var(--shadow-card-elevated)]',
  ghost:
    'bg-white/[0.01] border border-white/[0.06] text-white shadow-[var(--shadow-card-ghost)]',
  glass:
    'glow-card text-white',
  tile:
    'text-white',
} as const;

export type CardVariant = keyof typeof cardVariants;

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
} as const;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', children, ...props }, ref) => {
    const baseStyle = 'font-sans rounded-lg transition-all duration-300';

    return (
      <div
        ref={ref}
        className={twMerge(clsx(baseStyle, cardVariants[variant], paddings[padding], className))}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
