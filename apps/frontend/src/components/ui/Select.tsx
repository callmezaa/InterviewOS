'use client';

import React, { forwardRef, useId } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string | boolean;
  icon?: React.ElementType;
}

const sizeMap = {
  sm: 'h-7 py-0.5 pr-6 pl-2 text-[11px]',
  md: 'h-9 py-1.5 pr-8 pl-3 text-[13px]',
  lg: 'h-10 py-2 pr-10 pl-4 text-[14px]',
};

const iconPadding = { sm: 'pl-7', md: 'pl-9', lg: 'pl-10' };

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, size = 'md', error, icon: Icon, style, children, ...props }, ref) => {
    const id = useId();
    const selectId = props.id || id;
    const hasError = !!error;
    const errorMsg = typeof error === 'string' ? error : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-[13px] text-white/50 font-medium">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
              <Icon className="h-4 w-4 text-white/30" />
            </div>
          )}
          <select
            ref={ref}
            id={selectId}
            className={twMerge(clsx(
              'w-full appearance-none border rounded-md bg-surface-tile-2 text-white font-sans transition-all duration-150',
              'focus:outline-none focus:ring-1 focus:ring-primary',
              hasError
                ? 'border-red-500/30 focus:border-red-500/50 focus:ring-red-500/40'
                : 'border-white/[0.06] hover:border-white/[0.12]',
              sizeMap[size],
              Icon && iconPadding[size],
              className,
            ))}
            aria-invalid={hasError || undefined}
            aria-describedby={errorMsg ? `${selectId}-error` : undefined}
            {...props}
          >
            {children}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronDown className="h-3.5 w-3.5 text-white/40" />
          </div>
        </div>
        {errorMsg && (
          <p id={`${selectId}-error`} className="text-[12px] text-red-400/70" role="alert">
            {errorMsg}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';
