'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ChevronDown, LogIn } from 'lucide-react';
import Link from 'next/link';
import { IlustrationError } from '../../components/ui/Illustrations';
import { captureError } from '../../lib/sentry';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('[Auth Error]', error);
    captureError(error, {
      route: 'auth',
      tags: { error_boundary: 'auth' },
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
        className="relative z-10 flex flex-col items-center gap-5 text-center max-w-[420px]"
      >
        <div className="w-[100px] h-[75px] text-red-400/20">
          <IlustrationError className="w-full h-full" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <h1 className="font-display font-semibold text-h1 text-white/90">
            Authentication error
          </h1>
          <p className="text-body-muted/50 text-[14px] leading-relaxed max-w-[340px]">
            Something went wrong during authentication. Please try again.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="group inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-pill text-[14px] font-normal tracking-tight hover:bg-primary-focus transition-all duration-200"
          >
            <RefreshCw className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />
            <span>Retry</span>
          </button>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 px-4 py-2 text-body-muted/60 hover:text-white text-[14px] font-normal tracking-tight transition-colors duration-200 border border-white/[0.06] hover:border-white/[0.12] rounded-pill"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </Link>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-1.5 text-[10px] font-mono text-body-muted/20 hover:text-body-muted/55 transition-colors"
        >
          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`} />
          <span>Error details</span>
        </button>
        {showDetails && (
          <motion.pre
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[400px] p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg text-[10px] font-mono text-left text-red-300/50 leading-relaxed whitespace-pre-wrap max-h-[160px] overflow-y-auto"
          >
            {error.message}{error.stack ? `\n\n${error.stack}` : ''}
          </motion.pre>
        )}
      </motion.div>
    </div>
  );
}
