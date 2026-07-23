'use client';

import React, { useState, useEffect, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInterviewStore } from '../../../store/useInterviewStore';
import { Button } from '../../../components/ui/Button';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { InputField } from '../../../components/auth/InputField';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { OAuthButtons } from '../../../components/auth/OAuthButtons';
import { PasswordField } from '../../../components/auth/PasswordField';
import { API_URL } from '../../../lib/config';

export default function RegisterPage() {
  const router = useRouter();
  const { user, setUser } = useInterviewStore();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'CANDIDATE' | 'INTERVIEWER'>('CANDIDATE');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; email?: boolean; password?: boolean }>({});

  const emailId = useId();
  const passwordId = useId();
  const nameId = useId();

  const validate = useCallback((field: string, val: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!val.trim()) return 'Full name is required';
        if (val.trim().length < 2) return 'Name must be at least 2 characters';
        return undefined;
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
        return undefined;
      case 'password':
        if (!val) return 'Password is required';
        if (val.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(val)) return 'Include at least one uppercase letter';
        if (!/[0-9!@#$%^&*(),.?":{}|<>]/.test(val)) return 'Include at least one number or symbol';
        return undefined;
      default:
        return undefined;
    }
  }, []);

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
  };

  const handleChange = (field: string, value: string, setter: (v: string) => void) => {
    setter(value);
    if (touched[field as keyof typeof touched]) {
      setErrors((prev) => ({ ...prev, [field]: validate(field, value) }));
    }
  };

  const isFormValid =
    !validate('name', name) && !validate('email', email) && !validate('password', password);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && user) router.push('/dashboard'); }, [mounted, user, router]);

  if (!mounted) return <AuthSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validate('name', name);
    const emailErr = validate('email', email);
    const passwordErr = validate('password', password);
    setErrors({ name: nameErr, email: emailErr, password: passwordErr });
    setTouched({ name: true, email: true, password: true });

    if (nameErr || emailErr || passwordErr) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
        credentials: 'include',
      });

      if (response.status === 429) {
        throw new Error('Too many registration attempts. Please wait a moment and try again.');
      }

      if (response.status === 404) {
        throw new Error('Auth service not available. Make sure the API server is running on port 3001.');
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || `Server error (${response.status}). Please try again.`);
      }

      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; path=/api/auth/refresh; max-age=604800; SameSite=Lax`;
      }
      setUser(data.user);
      toast.success('Account created!', `Signed in successfully as ${data.user.name}.`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      console.error('Register error:', err);
      toast.error('Registration failed', message);
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout heading="Create your account">
      <div className="grid grid-cols-2 gap-2 mb-4">
        {(['INTERVIEWER', 'CANDIDATE'] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-lg border text-center transition-all duration-200 ${
              role === r
                ? 'border-white/[0.12] bg-white/[0.04]'
                : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.1] hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-[20px]">{r === 'INTERVIEWER' ? '🎤' : '🧑'}</span>
            <span className={`text-[12px] font-semibold leading-tight ${role === r ? 'text-white' : 'text-white/70'}`}>
              {r === 'INTERVIEWER' ? "I'm an Interviewer" : "I'm a Candidate"}
            </span>
            <span className="text-[10px] text-body-muted/40 leading-tight">
              {r === 'INTERVIEWER' ? 'Conduct & evaluate sessions' : 'Attend & participate'}
            </span>
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={nameId} className="text-[12px] text-white/40 font-medium">
            Full Name
          </label>
          <InputField
            id={nameId}
            type="text"
            required
            value={name}
            onChange={(e) => handleChange('name', e.target.value, setName)}
            onBlur={() => handleBlur('name', name)}
            placeholder="Alex Chen"
            autoComplete="name"
            autoFocus
          />
          {errors.name && touched.name && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-400/60">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.name}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-[12px] text-white/40 font-medium">
            Work Email
          </label>
          <InputField
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(e) => handleChange('email', e.target.value, setEmail)}
            onBlur={() => handleBlur('email', email)}
            placeholder="you@company.com"
            autoComplete="email"
          />
          {errors.email && touched.email && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-400/60">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.email}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-[12px] text-white/40 font-medium">
            Password
          </label>
          <PasswordField
            id={passwordId}
            required
            value={password}
            onChange={(e) => handleChange('password', e.target.value, setPassword)}
            onBlur={() => handleBlur('password', password)}
            autoComplete="new-password"
          />
          {errors.password && touched.password && (
            <span className="flex items-center gap-1.5 text-[11px] text-red-400/60">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.password}
            </span>
          )}
        </div>

        <Button
          type="submit"
          variant="default"
          disabled={loading || (!isFormValid && touched.name && touched.email && touched.password)}
          className="w-full mt-1"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create account'}
        </Button>
      </form>

      <div className="mt-5">
        <OAuthButtons />
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
        <Link
          href="/auth/login"
          className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
        >
          Already have an account?{' '}
          <span className="text-white/70 font-medium">Sign in</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
