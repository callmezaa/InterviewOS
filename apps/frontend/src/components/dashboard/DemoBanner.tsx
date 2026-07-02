'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, X } from 'lucide-react';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="relative flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/15 bg-gradient-to-r from-primary/[0.03] via-primary/[0.02] to-transparent">
            <div className="shrink-0 w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-on-dark" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-white/80 font-medium">
                You&apos;re exploring in demo mode
              </p>
              <p className="text-[11px] text-body-muted/50 mt-0.5">
                Sign up free to save interviews, invite your team, and unlock AI-powered feedback.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link
                href="/auth/register"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-[12px] font-medium hover:bg-primary-focus transition-colors"
              >
                <span>Sign Up Free</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-lg text-body-muted/40 hover:text-white hover:bg-white/[0.04] transition-all"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
