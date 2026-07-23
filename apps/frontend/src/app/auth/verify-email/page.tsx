'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { AuthSkeleton } from '../../../components/auth/AuthSkeleton';
import { API_URL } from '../../../lib/config';

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const calledRef = useRef(false);

  const [state, setState] = useState<'verifying' | 'success' | 'error'>('verifying');
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
          throw new Error('Too many requests. Please wait a moment and try again.');
        }

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Verification failed');
        }

        setState('success');
        toast.success('Email verified', 'Your email has been verified successfully.');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Connection failed.';
        setState('error');
        setErrorMessage(message);
        toast.error('Verification failed', message);
      }
    };

    verify();
  }, [token]);

  if (!token) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center gap-5 text-center py-4">
          <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
          <div className="flex flex-col gap-1">
            <h2 className="font-display font-bold text-[20px] text-white">Invalid link</h2>
            <p className="text-[13px] text-white/50 leading-relaxed">
              This verification link is missing or malformed. Please request a new one.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-col items-center gap-5 text-center py-4">
        {state === 'verifying' && (
          <>
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-bold text-[20px] text-white">
                Verifying your email
              </h2>
              <p className="text-[13px] text-white/50 leading-relaxed">
                Please wait while we verify your email address.
              </p>
            </div>
          </>
        )}

        {state === 'success' && (
          <>
            <ShieldCheck className="w-10 h-10 text-primary" />
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-bold text-[20px] text-white">
                Email verified
              </h2>
              <p className="text-[13px] text-white/50 leading-relaxed max-w-sm">
                Your email has been verified successfully. You can now sign in to your account.
              </p>
            </div>
            <Link href="/auth/login">
              <Button variant="default" className="px-6">
                Sign In
              </Button>
            </Link>
          </>
        )}

        {state === 'error' && (
          <>
            <ShieldCheck className="w-10 h-10 text-primary mx-auto" />
            <div className="flex flex-col gap-1">
              <h2 className="font-display font-bold text-[20px] text-white">
                Verification failed
              </h2>
              <p className="text-[13px] text-white/50 leading-relaxed max-w-sm">
                {errorMessage}
              </p>
            </div>
            <Link
              href="/auth/login"
              className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
            >
              Back to Sign In
            </Link>
          </>
        )}
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
