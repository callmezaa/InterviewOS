'use client';

import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '../ui/Input';

interface PasswordFieldProps {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  hasError?: boolean;
  onBlur?: () => void;
  autoComplete?: string;
  autoFocus?: boolean;
}

function getStrength(password: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!password) return { score: 0, label: '', color: '' };

  let points = 0;
  if (password.length >= 8) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(password)) points++;

  if (points <= 1) return { score: 1, label: 'Weak', color: 'bg-red-400/70' };
  if (points === 2) return { score: 2, label: 'Medium', color: 'bg-yellow-400/70' };
  return { score: 3, label: 'Strong', color: 'bg-emerald-400/70' };
}

export function PasswordField({
  id,
  value,
  onChange,
  placeholder = '••••••••',
  required,
  hasError,
  onBlur,
  autoComplete,
  autoFocus,
}: PasswordFieldProps) {
  const strength = getStrength(value);

  return (
    <div className="flex flex-col gap-2">
      <Input
        id={id}
        type="password"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        error={hasError ? ' ' : undefined}
        onBlur={onBlur}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        icon={Lock}
        size="lg"
      />

      {value && (
        <motion.div
          className="flex flex-col gap-1.5"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex gap-1 h-[3px]">
            {[1, 2, 3].map((segment) => (
              <motion.div
                key={segment}
                className={`flex-1 rounded-full transition-colors duration-300 ${
                  strength.score >= segment ? strength.color : 'bg-white/[0.05]'
                }`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.3, delay: segment * 0.05 }}
                style={{ transformOrigin: 'left' }}
              />
            ))}
          </div>
          <span
            className={`text-[12px] font-medium transition-colors duration-300 ${
              strength.score === 1
                ? 'text-red-400/70'
                : strength.score === 2
                  ? 'text-yellow-400/70'
                  : strength.score === 3
                    ? 'text-emerald-400/70'
                    : 'text-transparent'
            }`}
          >
            {strength.label}
          </span>
        </motion.div>
      )}
    </div>
  );
}
