'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { InputField } from '../../../components/auth/InputField';
import { API_URL } from '../../../lib/config';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Request failed');
      }

      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Request failed', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Master Your Next Interview"
      subheading="Practice with AI-powered mock interviews and get real-time feedback."
    >
      {sent ? (
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <CheckCircle2 className="w-12 h-12 text-primary" />
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-h2 text-white">
              Check your inbox
            </h2>
            <p className="text-white/55 text-[14px] leading-relaxed max-w-sm">
              If an account with <strong className="text-white/60">{email}</strong> exists, a password reset link has been sent.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="text-[13px] text-primary hover:text-primary/80 transition-colors duration-200 font-medium underline underline-offset-2"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-2 mb-7">
            <h2 className="font-semibold text-h1 text-white">
              Forgot password
            </h2>
            <p className="text-[14px] text-white/55 leading-relaxed">
              Enter your email address and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <InputField
              id="forgot-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              icon={Mail}
            />

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 text-[15px] font-medium rounded-full"
            >
              <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
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
        </>
      )}
    </AuthLayout>
  );
}
