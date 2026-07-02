import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { hoverScale } from '../../lib/motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const MotionButton = motion.button;

const variantStyles = {
  primary:
    'bg-primary text-on-primary rounded-md px-5 py-2.5 font-normal text-[15px] hover:bg-primary-focus',
  secondary:
    'bg-white/[0.03] text-white border border-white/[0.06] rounded-md px-4 py-2 font-normal text-[14px] hover:bg-white/[0.06] hover:border-white/[0.12]',
  ghost:
    'bg-transparent text-white/60 rounded-md px-3.5 py-[7px] font-normal text-[13px] hover:text-white hover:bg-white/[0.04]',
  danger:
    'bg-danger text-white rounded-md px-4 py-2 font-normal text-[14px] hover:bg-danger-soft',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', children, ...props }, ref) => {
    const baseStyle =
      'inline-flex items-center justify-center font-sans transition-all duration-100 ease-out focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-focus select-none disabled:opacity-50 disabled:pointer-events-none';

    return (
      <MotionButton
        ref={ref as React.Ref<HTMLButtonElement>}
        className={twMerge(clsx(baseStyle, variantStyles[variant], className))}
        {...hoverScale}
        {...(props as any)}
      >
        {children}
      </MotionButton>
    );
  }
);
Button.displayName = 'Button';
