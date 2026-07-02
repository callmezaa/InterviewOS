'use client';

import React, { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useInterviewStore, type UserSession } from '../../../store/useInterviewStore';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { InputField } from '../../../components/auth/InputField';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { OAuthButtons } from '../../../components/auth/OAuthButtons';
import { API_URL } from '../../../lib/config';
import { createGuestUser } from '../../../lib/guest';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user) router.push('/dashboard');
  }, [mounted, user, router]);

  if (!mounted) return <AuthSkeleton />;

  const handleGuestLogin = () => {
    const guest = createGuestUser();
    setUser(guest);
    toast.success('Welcome to InterviewOS!', 'Exploring in demo mode — no account needed.');
    router.push('/dashboard');
  };

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

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || `Request failed (${response.status})`);
      }

      const data = await response.json().catch(() => null);
      if (!data) {
        throw new Error('Invalid response from server');
      }

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
    } finally {
      setLoading(false);
    }
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
    } finally {
      setLoading(false);
    }
  };

  const handleCancel2fa = () => {
    setTwoFactorTempToken(null);
    setTwoFactorCode('');
    setLoading(false);
  };

  return (
    <AuthLayout
      heading="Master Your Next Interview"
      subheading="Practice with AI-powered mock interviews and get real-time feedback to land your dream job."
    >
      {/* Heading */}
      <div className="flex flex-col gap-2 mb-7">
        <h2 className="font-semibold text-h1 text-white">
          {twoFactorTempToken ? 'Verification Required' : 'Welcome back'}
        </h2>
        <p className="text-[14px] text-white/55 leading-relaxed">
          {twoFactorTempToken
            ? 'Enter the 6-digit code from your authenticator app to continue.'
            : 'Sign in to continue evaluating talent.'}
        </p>
      </div>

      {/* 2FA Challenge Form */}
      {twoFactorTempToken ? (
        <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary-on-dark"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
            </div>

            <div className="flex justify-center gap-2 w-full">
              <input
                type="text"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                className="w-48 h-14 text-center text-[28px] font-mono font-semibold tracking-[0.5em] bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-body-muted/30 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={twoFactorCode.length !== 6 || loading}
            className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium rounded-full"
            style={{
              boxShadow: loading ? 'none' : '0 4px 12px -2px var(--color-primary-glow)',
            }}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Verify</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>

          <button
            type="button"
            onClick={handleCancel2fa}
            className="text-[13px] text-white/50 hover:text-white/70 transition-colors text-center"
          >
            Use a different account
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={emailId} className="text-[13px] text-white/50 font-medium">
            Email
          </label>
          <InputField
            id={emailId}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            icon={Mail}
            autoComplete="email"
            autoFocus
          />
        </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor={passwordId} className="text-[13px] text-white/50 font-medium">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[12px] text-white/50 hover:text-primary transition-colors duration-200"
              >
                Forgot password?
              </Link>
            </div>
          <InputField
            id={passwordId}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
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
              <span>Sign in</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </form>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3 mt-6 mb-4">
        <div className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-[11px] text-white/30 font-medium tracking-wide uppercase">or</span>
        <div className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Guest / Demo entry */}
      <motion.button
        type="button"
        onClick={handleGuestLogin}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="group relative w-full flex items-center gap-4 p-4 rounded-2xl border border-primary/20 bg-primary/[0.03] hover:bg-primary/[0.06] hover:border-primary/30 transition-all duration-300 text-left cursor-pointer overflow-hidden"
      >
        {/* Animated gradient shimmer */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
          <Sparkles className="w-5 h-5 text-primary-on-dark" />
        </div>

        <div className="relative flex-1 min-w-0">
          <span className="block text-[14px] font-semibold text-white/90 group-hover:text-white transition-colors">
            Try the Interactive Demo
          </span>
          <span className="block text-[12px] text-white/40 group-hover:text-white/50 transition-colors mt-0.5">
            Explore the full platform — no sign-up required
          </span>
        </div>

        <div className="relative shrink-0 flex items-center gap-1.5 text-primary-on-dark text-[13px] font-medium opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
          <span>Launch</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </motion.button>

      {/* OAuth */}
      <div className="mt-5">
        <OAuthButtons />
      </div>

      {/* Footer */}
      <div className="mt-7 pt-5 border-t border-white/[0.06] text-center">
        <Link
          href="/auth/register"
          className="text-[13px] text-white/55 hover:text-white/60 transition-colors duration-200"
        >
          Don&apos;t have an account?{' '}
          <span className="text-primary font-medium underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors duration-200">
            Create one free
          </span>
        </Link>
      </div>
    </AuthLayout>
  );
}
