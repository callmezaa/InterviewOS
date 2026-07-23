'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInterviewStore } from '../../../store/useInterviewStore';
import { toast } from '../../../store/useToastStore';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { Loader2, CheckCircle } from 'lucide-react';

function OAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useInterviewStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const userParam = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMessage('Authentication failed. Please try again.');
      return;
    }

    if (!userParam) {
      setStatus('error');
      setErrorMessage('Invalid authentication response. Please try signing in again.');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      setUser(user);
      setStatus('success');
      toast.success('Signed in successfully', `Welcome${user.name ? ', ' + user.name : ''}!`);
      setTimeout(() => router.push('/dashboard'), 600);
    } catch {
      setStatus('error');
      setErrorMessage('Failed to process authentication. Please try again.');
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams, setUser, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-8">
      {status === 'processing' && (
        <>
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-white/50">Completing authentication...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle className="w-8 h-8 text-emerald-400" />
          <p className="text-[13px] text-emerald-400/70">Signed in successfully! Redirecting...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/15 flex items-center justify-center">
            <span className="text-red-400 text-lg font-medium">!</span>
          </div>
          <p className="text-[13px] text-red-400/70 text-center max-w-xs">{errorMessage}</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="text-[12px] text-white/40 hover:text-white/60 transition-colors"
          >
            Back to Sign In
          </button>
        </>
      )}
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center gap-5 py-8">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[13px] text-white/50">Loading...</p>
        </div>
      }>
        <OAuthCallbackContent />
      </Suspense>
    </AuthLayout>
  );
}
