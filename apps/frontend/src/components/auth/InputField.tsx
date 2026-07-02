'use client';

import { Input } from '../ui/Input';

export function InputField({
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
  icon,
  hasError,
  onBlur,
  autoComplete,
  autoFocus,
}: {
  id: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  icon: React.ElementType;
  hasError?: boolean;
  onBlur?: () => void;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  return (
    <Input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      icon={icon}
      error={hasError ? ' ' : undefined}
      onBlur={onBlur}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
      size="lg"
    />
  );
}
