'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import Link from 'next/link';

export function PreFooterCTA() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.3 });

  return (
    <section 
      ref={ref} 
      className="bg-surface-black py-section px-6 md:px-section-x relative overflow-hidden flex flex-col items-center justify-center"
    >      <div className="max-w-[1000px] w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative group overflow-hidden p-10 sm:p-16 rounded-lg border border-white/[0.06] bg-white/[0.01] text-center flex flex-col items-center justify-center gap-6 shadow-[inset_0_1.5px_0_rgba(255,255,255,0.04)] transition-all duration-500"
        >          {/* Badge */}
          <span className="inline-flex items-center h-6 px-3.5 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase text-primary-on-dark bg-gradient-to-b from-[#0d3057] to-[#071d38] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.35)]">
            Elevate your team hiring standard
          </span>

          {/* Headline */}
          <h2 className="font-display font-semibold text-[32px] sm:text-[48px] leading-[1.1] tracking-tight text-white max-w-[650px]">
            Ready to run better engineering interviews?
          </h2>

          {/* Subheading */}
          <p className="text-body-muted/60 text-[16px] sm:text-[18px] leading-relaxed max-w-[480px]">
            Start your first session — free, no setup or credit card required.
          </p>

          {/* Call-to-action button wrapper */}
          <div className="relative group/btn mt-4">
            <Link href="/auth/login">
              <span className="flex items-center justify-center gap-2 h-[52px] px-9 rounded-full text-[15px] font-semibold tracking-tight text-white select-none bg-gradient-to-b from-[#0d86ff] to-[#0062c4] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,20,60,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#1890ff] hover:to-[#0a66ce] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,20,60,0.3)] active:translate-y-px active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(0,20,60,0.4)]">
                Get Started Free
                <span className="text-[16px] transition-transform duration-300 ease-out group-hover/btn:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
