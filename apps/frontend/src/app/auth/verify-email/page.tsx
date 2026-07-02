'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { API_URL } from '../../../lib/config';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const calledRef = useRef(false);

  const [state, setState] = useState<'verifying' | 'success' | 'error'>(
    'verifying',
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;

    const verify = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (response.status === 429) {
          throw new Error(
            'Too many requests. Please wait a moment and try again.',
          );
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        setState('success');
        toast.success('Email verified', 'Your email has been verified successfully.');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Connection failed.';
        setState('error');
        setErrorMessage(message);
        toast.error('Verification failed', message);
      }
    };

    verify();
  }, [token]);

  if (!token) {
    return (
      <AuthLayout
        heading="Master Your Next Interview"
        subheading="Practice with AI-powered mock interviews."
      >
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
          <div className="flex flex-col gap-2">
            <h2 className="font-semibold text-h2 text-white">
              Invalid link
            </h2>
            <p className="text-white/55 text-[14px] leading-relaxed">
              This verification link is missing or malformed. Please request a new one.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="text-[13px] text-primary hover:text-primary/80 transition-colors duration-200 font-medium underline underline-offset-2 mt-2"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      heading="Master Your Next Interview"
      subheading="AI-powered mock interviews with real-time feedback."
    >
      <div className="flex flex-col items-center gap-5 text-center py-4">
        {state === 'verifying' && (
          <>
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-h2 text-white">
                Verifying your email
              </h2>
              <p className="text-white/55 text-[14px] leading-relaxed">
                Please wait while we verify your email address.
              </p>
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <ShieldCheck className="w-12 h-12 text-primary" />
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-h2 text-white">
                Email verified
              </h2>
              <p className="text-white/55 text-[14px] leading-relaxed max-w-sm">
                Your email has been verified successfully. You can now sign in to your account.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 mt-2"
            >
              <Button variant="primary" className="rounded-full px-6 py-2.5 text-[14px]">
                <Mail className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <ShieldCheck className="w-12 h-12 text-primary mx-auto" />
            <div className="flex flex-col gap-2">
              <h2 className="font-semibold text-h2 text-white">
                Verification failed
              </h2>
              <p className="text-white/55 text-[14px] leading-relaxed max-w-sm">
                {errorMessage}
              </p>
            </div>
            <Link
              href="/auth/login"
              className="text-[13px] text-primary hover:text-primary/80 transition-colors duration-200 font-medium underline underline-offset-2 mt-2"
            >
              Back to Sign In
            </Link>
          </>
        )}
      </div>

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

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <VerifyEmailForm />
    </Suspense>
  );
}