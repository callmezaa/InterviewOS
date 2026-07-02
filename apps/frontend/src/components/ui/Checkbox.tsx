'use client';

import React from 'react';

interface CheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, indeterminate, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-2 ${disabled ? 'opacity-40' : ''} cursor-pointer select-none`}>
      <button
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        onClick={(e) => { e.stopPropagation(); if (!disabled) onChange(); }}
        className={`relative w-4 h-4 rounded border transition-all duration-150 ${
          checked || indeterminate
            ? 'border-primary bg-primary'
            : 'border-white/[0.15] bg-white/[0.02] hover:border-white/[0.3] hover:bg-white/[0.04]'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {indeterminate ? (
          <svg className="absolute inset-0 w-full h-full p-0.5 text-on-primary" viewBox="0 0 16 16" fill="none">
            <rect x="3" y="7" width="10" height="2" rx="1" fill="currentColor" />
          </svg>
        ) : checked ? (
          <svg className="absolute inset-0 w-full h-full p-0.5 text-on-primary" viewBox="0 0 16 16" fill="none">
            <path d="M4 8.5L6.5 11L12 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </button>
      {label && <span className="text-[13px] text-body-muted/70">{label}</span>}
    </label>
  );
}
