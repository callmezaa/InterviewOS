'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  icon?: React.ElementType;
  error?: string | boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-7 py-0.5 px-2.5 text-[13px]',
  md: 'py-2.5 px-4 text-[14px]',
  lg: 'py-3 px-4 text-[15px]',
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon: Icon, error, size = 'md', className, type: inputType, onFocus, onBlur, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [focused, setFocused] = useState(false);
    const isPassword = inputType === 'password';
    const type = isPassword ? (showPassword ? 'text' : 'password') : inputType;
    const hasError = !!error;
    const errorMsg = typeof error === 'string' ? error : undefined;
    const iconColor = hasError ? 'text-red-400/60' : focused ? 'text-primary' : 'text-white/30';

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] text-white/50 font-medium" htmlFor={props.id}>
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
              <Icon className={`w-4 h-4 transition-colors duration-200 ${iconColor}`} />
            </div>
          )}
          <input
            ref={ref}
            type={type}
            className={`w-full bg-white/[0.03] border text-white placeholder:text-white/20 outline-none transition-all duration-200 rounded-md ${sizeMap[size]}${Icon ? ' pl-10' : ''}${isPassword ? ' pr-10' : ''} ${
              hasError
                ? 'border-red-500/30 focus:border-red-500/50 focus:shadow-[var(--shadow-focus-danger)]'
                : focused
                  ? 'border-primary/50 shadow-[var(--shadow-focus-primary)] bg-white/[0.04]'
                  : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.04]'
            } ${className ?? ''}`}
            onFocus={(e) => { setFocused(true); onFocus?.(e); }}
            onBlur={(e) => { setFocused(false); onBlur?.(e); }}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-white/20 hover:text-white/50 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {errorMsg && <p className="text-[12px] text-red-400/70">{errorMsg}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
