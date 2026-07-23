'use client';

import React, { Suspense, useState, useId } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
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
      <AuthLayout>
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-bold text-[20px] text-white">Invalid link</h2>
            <p className="text-[13px] text-white/50 leading-relaxed">
              This password reset link is missing or malformed. Please request a new one.
            </p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
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
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout heading="Set new password">
      <p className="text-[13px] text-white/50 leading-relaxed mb-6">
        Must be at least 8 characters.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor={passwordId} className="text-[12px] text-white/40 font-medium">
            New Password
          </label>
          <InputField
            id={passwordId}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirm-password" className="text-[12px] text-white/40 font-medium">
            Confirm Password
          </label>
          <InputField
            id="confirm-password"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" variant="default" disabled={loading} className="w-full mt-1">
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1.5 text-[12px] text-white/40 hover:text-white/60 transition-colors group"
        >
          <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" />
          Back to Sign In
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
