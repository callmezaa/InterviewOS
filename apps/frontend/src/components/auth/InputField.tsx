'use client';

import { Input } from '../ui/Input';

export function InputField({
  id,
  type,
  value,
  onChange,
  placeholder,
  required,
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
      onBlur={onBlur}
      autoComplete={autoComplete}
      autoFocus={autoFocus}
    />
  );
}
