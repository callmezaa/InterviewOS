'use client';

import React, { Suspense, useState, useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { InputField } from '../../../components/auth/InputField';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { API_URL } from '../../../lib/config';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordId = useId();

  if (!token) {
    return (
      <AuthLayout heading="Master Your Next Interview" subheading="Practice with AI-powered mock interviews.">
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-h2 text-white">Invalid link</h2>
            <p className="text-white/55 text-[14px] leading-relaxed">
              This password reset link is missing or malformed. Please request a new one.
            </p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-[13px] text-primary hover:text-primary/80 transition-colors duration-200 font-medium underline underline-offset-2 mt-2"
          >
            Request new link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      toast.error('Weak password', 'Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match', 'Please confirm your new password.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Reset failed');
      }

      toast.success('Password updated', 'You can now sign in with your new password.');
      router.push('/auth/login');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Reset failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout heading="Master Your Next Interview" subheading="Practice with AI-powered mock interviews.">
      <div className="flex flex-col gap-2 mb-7">
        <h2 className="font-semibold text-h1 text-white">Set new password</h2>
        <p className="text-[14px] text-white/55 leading-relaxed">
          Must be at least 8 characters.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label htmlFor={passwordId} className="text-[13px] text-white/50 font-medium">New Password</label>
          <InputField
            id={passwordId}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="confirm-password" className="text-[13px] text-white/50 font-medium">Confirm Password</label>
          <InputField
            id="confirm-password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium rounded-full"
        >
          <span>{loading ? 'Resetting...' : 'Reset Password'}</span>
          {!loading && <ArrowRight className="w-4 h-4" />}
        </Button>
      </form>

      <div className="mt-7 pt-5 border-t border-white/[0.06] text-center">
        <Link
          href="/auth/login"
          className="flex items-center justify-center gap-1.5 text-[13px] text-white/55 hover:text-white/60 transition-colors duration-200 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="underline underline-offset-2">Back to Sign In</span>
        </Link>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
