'use client';

import Link from 'next/link';
import { Terminal, RefreshCw, WifiOff } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col items-center justify-center px-6">
      <div className="flex flex-col items-center gap-6 text-center max-w-[420px]">
        <div className="w-16 h-16 text-white/15">
          <WifiOff className="w-full h-full" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-display font-semibold text-[22px] text-white/90">You&apos;re offline</h1>
          <p className="text-body-muted/60 text-[14px] leading-relaxed">
            Check your connection and try again. InterviewOS will resume when you&apos;re back online.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-pill text-[14px] hover:bg-primary-focus transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-body-muted/60 hover:text-white text-[14px] border border-white/[0.06] hover:border-white/[0.12] rounded-pill transition-all"
          >
            <Terminal className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
