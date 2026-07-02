'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, ArrowRight, X } from 'lucide-react';
import { Button } from './Button';

export interface SignUpPromptProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  feature?: string;
}

const benefits = [
  'Save interviews & review history',
  'Invite team members',
  'Unlimited practice sessions',
  'AI-powered feedback & transcripts',
];

export const SignUpPrompt: React.FC<SignUpPromptProps> = ({
  isOpen,
  onClose,
  title = 'Create your free account',
  description = 'Sign up to unlock this feature and save your progress.',
  feature,
}) => {
  const router = useRouter();

  const handleSignUp = useCallback(() => {
    router.push('/auth/register');
  }, [router]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            key="signup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="signup-prompt"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-surface-tile-2/95 backdrop-blur-xl overflow-hidden"
          >
            {/* Gradient accent bar */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary/40 via-primary-on-dark to-primary/40" />

            <div className="p-6 sm:p-8">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-all"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                <Sparkles className="w-6 h-6 text-primary-on-dark" />
              </div>

              {/* Title & description */}
              <h3 className="font-display font-semibold text-[20px] text-white leading-tight">
                {title}
              </h3>
              <p className="mt-2 text-[13px] text-body-muted/60 leading-relaxed">
                {feature ? (
                  <>
                    <span className="text-white/80 font-medium">{feature}</span>
                    {' — '}{description}
                  </>
                ) : description}
              </p>

              {/* Benefits list */}
              <div className="mt-6 flex flex-col gap-2.5">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 border border-success/30 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-success-soft" />
                    </div>
                    <span className="text-[13px] text-white/70">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="mt-8 flex flex-col gap-2.5">
                <Button
                  variant="primary"
                  onClick={handleSignUp}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-[14px] font-medium rounded-xl"
                >
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-[13px] text-body-muted/50 hover:text-white/70 transition-colors rounded-xl hover:bg-white/[0.03]"
                >
                  Continue Exploring
                </button>
              </div>

              {/* Trust footer */}
              <p className="mt-5 text-[11px] text-body-muted/30 text-center leading-relaxed">
                No credit card required · Free forever · Cancel anytime
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
