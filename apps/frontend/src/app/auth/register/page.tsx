'use client';

import React, { useState, useEffect, useId, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInterviewStore } from '../../../store/useInterviewStore';
import { Button } from '../../../components/ui/Button';
import { Mail, User, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
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
  const role = 'CANDIDATE';
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) router.push('/dashboard');
  }, [mounted, user, router]);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Land Your Dream Job"
    >
      {/* Heading */}
      <div className="flex flex-col gap-2 mb-7">
        <h2 className="font-semibold text-h1 text-white">
          Create your account
        </h2>
        <p className="text-[14px] text-white/55 leading-relaxed">
          Start practicing today.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Full name */}
        <div className="flex flex-col gap-2">
          <label htmlFor={nameId} className="text-[13px] text-white/50 font-medium">
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
            icon={User}
            hasError={!!errors.name && touched.name}
            autoComplete="name"
            autoFocus
          />
          {errors.name && touched.name && (
            <span className="flex items-center gap-1.5 text-[12px] text-red-400/70">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.name}
            </span>
          )}
        </div>

        {/* Work email */}
        <div className="flex flex-col gap-2">
          <label htmlFor={emailId} className="text-[13px] text-white/50 font-medium">
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
            icon={Mail}
            hasError={!!errors.email && touched.email}
            autoComplete="email"
          />
          {errors.email && touched.email && (
            <span className="flex items-center gap-1.5 text-[12px] text-red-400/70">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.email}
            </span>
          )}
        </div>

        {/* Password */}
        <div className="flex flex-col gap-2">
          <label htmlFor={passwordId} className="text-[13px] text-white/50 font-medium">
            Password
          </label>
          <PasswordField
            id={passwordId}
            required
            value={password}
            onChange={(e) => handleChange('password', e.target.value, setPassword)}
            onBlur={() => handleBlur('password', password)}
            hasError={!!errors.password && touched.password}
            autoComplete="new-password"
          />
          {errors.password && touched.password && (
            <span className="flex items-center gap-1.5 text-[12px] text-red-400/70">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {errors.password}
            </span>
          )}
        </div>

        {/* CTA */}
        <Button
          type="submit"
          variant="primary"
          disabled={loading || (!isFormValid && touched.name && touched.email && touched.password)}
          className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium rounded-full mt-1"
          style={{
            boxShadow: loading
              ? 'none'
              : '0 4px 12px -2px var(--color-primary-glow)',
          }}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Create account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>

        {/* Trust pills */}
        <div className="flex items-center justify-center gap-5 pt-1">
          {['14-day free trial', 'No credit card', 'Cancel anytime'].map((item) => (
            <span key={item} className="flex items-center gap-1.5 text-[11px] text-white/40">
              <CheckCircle2 className="w-3 h-3 text-primary/40 shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </form>

      {/* OAuth */}
      <div className="mt-5">
        <OAuthButtons />
      </div>

      {/* Footer */}
      <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
        <Link
          href="/auth/login"
          className="text-[13px] text-white/55 hover:text-white/60 transition-colors duration-200"
        >
          Already have an account?{' '}
          <span className="text-primary font-medium underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors duration-200">
            Sign in
          </span>
        </Link>
      </div>
    </AuthLayout>
  );
}
