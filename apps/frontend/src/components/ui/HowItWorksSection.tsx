'use client';

import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Video, Code2, Sparkles } from 'lucide-react';
import { Badge } from './Badge';

const STEPS = [
  {
    Icon: Video,
    title: 'Host Creates a Room',
    description: 'Schedule a session and share a private invite link instantly. No setup required for candidates.',
    iconColor: 'text-blue-400',
  },
  {
    Icon: Code2,
    title: 'Code Together Live',
    description: 'Both join a WebRTC session with synchronized code editors, live video, and real-time cursor tracking.',
    iconColor: 'text-primary-on-dark',
  },
  {
    Icon: Sparkles,
    title: 'AI Evaluates Performance',
    description: 'Whisper transcribes every word. Our AI generates a structured feedback report on code quality and communication.',
    iconColor: 'text-primary-on-dark',
  },
];

export function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.3 });

  return (
    <section ref={ref} id="how-it-works" className="bg-surface-black py-section px-6 md:px-section-x">
      <div className="max-w-[1100px] mx-auto">

        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <Badge className="mb-3 inline-block">How it works</Badge>
          <h2 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight text-white mt-2">
            From invite to insight in minutes.
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative">

          {/* Desktop: animated horizontal connector line */}
          <motion.div
            className="hidden md:block absolute h-px bg-white/[0.06] pointer-events-none"
            style={{ top: '24px', left: 'calc(100% / 6)', right: 'calc(100% / 6)' }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={isInView ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6">
            {STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 28 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
                transition={{ duration: 0.6, delay: 0.15 + i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="group flex flex-col items-center text-center"
              >
                {/* Circle icon */}
                <div className="relative z-10 w-12 h-12 rounded-full bg-surface-tile-2 border border-white/[0.06] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.05)] flex items-center justify-center mb-6 transition-all duration-300 group-hover:border-white/20 group-hover:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.08),0_0_24px_rgba(255,255,255,0.05)]">
                  <step.Icon className={`w-5 h-5 ${step.iconColor} transition-transform duration-300 group-hover:scale-110`} />
                  {/* Step number badge */}
                  <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] rounded-full bg-surface-black border border-white/[0.12] text-[9px] font-mono font-bold text-white/55 flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>

                <h3 className="font-display font-semibold text-[17px] tracking-tight text-white mb-2.5 group-hover:text-white/90 transition-colors duration-200">
                  {step.title}
                </h3>
                <p className="text-body-muted/45 text-[13px] leading-[1.7] max-w-[230px] group-hover:text-body-muted/65 transition-colors duration-300">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
