'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, RefreshCw, ChevronDown, AlertTriangle, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { IlustrationError } from '../components/ui/Illustrations';
import { captureError } from '../lib/sentry';

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('[InterviewOS Error]', error);
    captureError(error, {
      route: 'root',
      tags: { error_boundary: 'root' },
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center gap-6 text-center max-w-[480px]"
      >
        <div className="flex items-center gap-2 select-none">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-[16px] tracking-tight">InterviewOS</span>
        </div>

        <div className="w-[120px] h-[90px] text-red-400/25">
          <IlustrationError className="w-full h-full" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col items-center gap-1"
        >
          <h1 className="font-display font-semibold text-h1 text-white/90">
            Something went wrong
          </h1>
          <p className="text-body-muted/60 text-[15px] leading-relaxed max-w-[360px] mt-1">
            An unexpected error occurred. Our team has been notified.
          </p>
        </motion.div>

        {error.digest && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25, duration: 0.3 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-pill text-[11px] font-mono text-body-muted/55 select-none"
          >
            <span>Error ID:</span>
            <span className="text-white/60">{error.digest}</span>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="flex items-center gap-3 mt-2"
        >
          <button
            onClick={() => unstable_retry()}
            className="group inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-pill text-[15px] font-normal tracking-tight hover:bg-primary-focus transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
            <span>Try again</span>
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-body-muted/60 hover:text-white text-[15px] font-normal tracking-tight transition-colors duration-200 border border-white/[0.06] hover:border-white/[0.12] rounded-pill"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="w-full max-w-[400px]"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-center gap-1.5 w-full py-2 text-[11px] font-mono text-body-muted/25 hover:text-body-muted/50 transition-colors"
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
            <span>Error details</span>
          </button>
          {showDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <pre className="mt-2 p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[11px] font-mono text-left text-red-300/60 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                {error.message}{error.stack ? `\n\n${error.stack}` : ''}
              </pre>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
