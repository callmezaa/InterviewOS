import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const badgeVariants = {
  default:
    'bg-white/[0.02] border border-white/[0.06] text-primary-on-dark/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
  primary:
    'bg-primary/10 border border-primary/20 text-primary-on-dark',
  success:
    'bg-success/10 border border-success/20 text-success-soft',
  warning:
    'bg-warning/10 border border-warning/20 text-warning-soft',
  danger:
    'bg-danger/10 border border-danger/20 text-danger-soft',
  neutral:
    'bg-white/[0.04] border border-white/[0.06] text-white/60',
  solid:
    'bg-primary text-on-primary-solid',
} as const;

const badgeSizes = {
  sm: 'px-1.5 py-0.5 text-[9px] font-mono',
  md: 'px-2.5 py-0.5 text-[11px] font-mono',
  lg: 'px-3 py-1 text-[11px] font-mono',
} as const;

const dotColors: Record<string, string> = {
  default: 'bg-primary-on-dark/50',
  primary: 'bg-primary-on-dark',
  success: 'bg-success-soft',
  warning: 'bg-warning-soft',
  danger: 'bg-danger-soft',
  neutral: 'bg-white/60',
  solid: 'bg-white',
};

export interface BadgeProps {
  variant?: keyof typeof badgeVariants;
  size?: keyof typeof badgeSizes;
  dot?: boolean;
  dotColor?: string;
  className?: string;
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps & React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, variant = 'default', size = 'md', dot, dotColor, children, ...props }, ref) => {
    const baseStyle = 'inline-flex items-center gap-1.5 rounded-pill font-semibold tracking-tight leading-none';

    return (
      <span
        ref={ref}
        className={twMerge(clsx(baseStyle, badgeVariants[variant], badgeSizes[size], className))}
        {...props}
      >
        {dot && (
          <span
            className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColor || dotColors[variant])}
          />
        )}
        {children}
      </span>
    );
  }
);
Badge.displayName = 'Badge';
