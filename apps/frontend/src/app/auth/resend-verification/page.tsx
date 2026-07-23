'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { InputField } from '../../../components/auth/InputField';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { API_URL } from '../../../lib/config';

function ResendVerificationForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      if (response.status === 400) {
        const data = await response.json();
        throw new Error(data.message || 'Your email is already verified.');
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Request failed');
      }

      setSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Request failed', message);
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout>
      {sent ? (
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <CheckCircle2 className="w-10 h-10 text-primary" />
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-bold text-[20px] text-white">
              Verification email sent
            </h2>
            <p className="text-[13px] text-white/50 leading-relaxed max-w-sm">
              If an account with <span className="text-white/60">{email}</span> exists and is unverified, a new verification link has been sent.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      ) : (
        <>
          <p className="text-[13px] text-white/50 leading-relaxed mb-6">
            Enter your email address and we&apos;ll send you a new verification link.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <InputField
              id="resend-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />

            <Button type="submit" variant="default" disabled={loading} className="w-full">
              {loading ? 'Sending...' : 'Send Verification Link'}
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
        </>
      )}
    </AuthLayout>
  );
}

export default function ResendVerificationPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <ResendVerificationForm />
    </Suspense>
  );
}
