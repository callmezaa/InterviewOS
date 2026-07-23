'use client';

import React, { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInterviewStore, type UserSession } from '../../../store/useInterviewStore';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, Loader2 } from 'lucide-react';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { InputField } from '../../../components/auth/InputField';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { OAuthButtons } from '../../../components/auth/OAuthButtons';
import { API_URL } from '../../../lib/config';

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useInterviewStore();
  const [mounted, setMounted] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [twoFactorTempToken, setTwoFactorTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  const emailId = useId();
  const passwordId = useId();

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (mounted && user) router.push('/dashboard'); }, [mounted, user, router]);

  if (!mounted) return <AuthSkeleton />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.status === 429) {
        throw new Error('Too many login attempts. Please wait a moment and try again.');
      }

      if (response.status === 404) {
        throw new Error('Auth service not available. Make sure the API server is running on port 3001.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || `Request failed (${response.status})`);
      }

      const data = await response.json().catch(() => null);
      if (!data) throw new Error('Invalid response from server');

      if (data.twoFactorRequired) {
        setTwoFactorTempToken(data.tempToken);
        setLoading(false);
        return;
      }

      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; path=/api/auth/refresh; max-age=604800; SameSite=Lax`;
      }

      setUser(data.user);
      toast.success('Welcome back!', `Signed in successfully as ${data.user.name}.`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      console.error('Auth error:', err);
      toast.error('Authentication failed', message);
    } finally { setLoading(false); }
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (twoFactorCode.length !== 6 || !twoFactorTempToken) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/2fa/challenge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tempToken: twoFactorTempToken, code: twoFactorCode }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Invalid verification code');
      }

      const data = await response.json();
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.refreshToken) {
        document.cookie = `refreshToken=${data.refreshToken}; path=/api/auth/refresh; max-age=604800; SameSite=Lax`;
      }
      setUser(data.user);
      toast.success('Welcome back!', `Signed in successfully as ${data.user.name}.`);
      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Verification failed', message);
    } finally { setLoading(false); }
  };

  const handleCancel2fa = () => {
    setTwoFactorTempToken(null);
    setTwoFactorCode('');
    setLoading(false);
  };

  if (twoFactorTempToken) {
    return (
      <AuthLayout heading="Verification Required">
        <p className="text-[13px] text-white/50 leading-relaxed mb-6">
          Enter the 6-digit code from your authenticator app to continue.
        </p>

        <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-5">
          <div className="flex justify-center">
            <input
              type="text"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              autoFocus
              autoComplete="one-time-code"
              className="w-44 h-12 text-center text-[24px] font-mono font-semibold tracking-[0.4em] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white/90 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-white/15 transition-all"
            />
          </div>

          <Button
            type="submit"
            variant="default"
            disabled={twoFactorCode.length !== 6 || loading}
            className="w-full"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
          </Button>

          <button
            type="button"
            onClick={handleCancel2fa}
            className="text-[12px] text-white/40 hover:text-white/60 transition-colors text-center"
          >
            Use a different account
          </button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout heading="Welcome back">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={emailId} className="text-[12px] text-white/40 font-medium">
            Email
          </label>
          <InputField
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor={passwordId} className="text-[12px] text-white/40 font-medium">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] text-white/40 hover:text-white/60 transition-colors"
            >
              Forgot?
            </Link>
          </div>
          <InputField
            id={passwordId}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
        </div>

        <Button type="submit" variant="default" disabled={loading} className="w-full mt-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign in'}
        </Button>
      </form>

      <div className="mt-5">
        <OAuthButtons />
      </div>

      <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
        <Link
          href="/auth/register"
          className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
        >
          Don&apos;t have an account?{' '}
          <span className="text-white/70 font-medium">Create one free</span>
        </Link>
      </div>
    </AuthLayout>
  );
}
