'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { ArrowRight, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';

const CALLOUT_POINTS = [
  {
    label: 'No credit card',
    icon: CreditCard,
  },
  {
    label: 'Team-ready beta access',
    icon: CheckCircle2,
  },
  {
    label: 'Secure interview workspace',
    icon: ShieldCheck,
  },
];

export function PricingCalloutSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.25 });

  return (
    <section
      id="pricing"
      ref={ref}
      className="scroll-mt-20 bg-surface-black px-6 py-section md:px-section-x"
    >
      <div className="mx-auto max-w-[1100px]">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: 24, filter: 'blur(6px)' }
          }
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="group relative overflow-hidden rounded-lg border border-white/[0.06] bg-white/[0.015] p-6 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.04)] transition-all duration-500 hover:bg-white/[0.025] sm:p-8 lg:p-10"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/20 opacity-50" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="flex max-w-[700px] flex-col gap-5">
                  <Badge variant="default">Free to start</Badge>

                  <div className="flex flex-col gap-3">
                    <h2 className="font-display text-[30px] font-semibold leading-tight tracking-tight text-white sm:text-[40px]">
                      Free during beta. No credit card.
                    </h2>
                <p className="max-w-[560px] font-sans text-[15px] leading-relaxed tracking-tight text-body-muted/55 sm:text-[16px]">
                  Run real engineering interviews with video, code playback, transcripts, and AI-assisted evaluation while your team validates the workflow.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {CALLOUT_POINTS.map(({ label, icon: Icon }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                    transition={{ duration: 0.45, delay: 0.12 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
                    className="flex min-h-10 items-center gap-2 rounded-lg border border-white/[0.06] bg-black/15 px-3 py-2 text-[12px] text-white/55 transition-colors duration-300 group-hover:border-white/[0.12] group-hover:text-white/70"
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0 text-primary-on-dark/70" />
                    <span className="font-sans tracking-tight">{label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              <div className="relative group/btn">
                <Link href="/auth/login">
                  <Button variant="primary" className="h-11 w-[176px] gap-2 text-[14px]">
                    Start free
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                  </Button>
                </Link>
              </div>
              <p className="max-w-[220px] font-mono text-[11px] leading-relaxed tracking-tight text-white/25 lg:text-right">
                Paid plans come later for growing hiring teams.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
