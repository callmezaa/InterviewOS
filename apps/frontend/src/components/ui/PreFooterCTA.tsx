'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Button } from './Button';
import { Badge } from './Badge';

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
          <Badge className="inline-block">Elevate your team hiring standard</Badge>

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
              <Button variant="primary" className="w-[200px] h-12 text-[15px] font-sans flex items-center justify-center gap-1.5">
                Get Started Free 
                <span className="text-[16px] transition-transform duration-300 ease-out transform group-hover/btn:translate-x-1.5">
                  →
                </span>
              </Button>
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
