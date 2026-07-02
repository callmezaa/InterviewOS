'use client';

import { useState, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

// ── Company data ─────────────────────────────────────────────────────────────
const COMPANIES = [
  {
    name: 'Google',
    description: 'Search · Cloud · AI infrastructure',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.41 0-6.19-2.78-6.19-6.19s2.78-6.19 6.19-6.19c1.55 0 2.964.576 4.05 1.526l3.11-3.11C19.246 2.222 15.937 1 12.24 1 5.756 1 .5 6.256.5 12.74S5.756 24.48 12.24 24.48c6.19 0 11.233-4.507 11.233-11.233 0-.82-.083-1.62-.236-2.39H12.24z" />
      </svg>
    ),
  },
  {
    name: 'Meta',
    description: 'Social · VR · AI research',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M16.924 5.3c-2.302 0-4.329 1.545-5.599 3.864C10.055 6.845 8.028 5.3 5.726 5.3 2.563 5.3 0 7.863 0 11.026c0 3.164 2.563 5.726 5.726 5.726 2.302 0 4.329-1.545 5.599-3.864 1.27 2.319 3.297 3.864 5.599 3.864 3.164 0 5.726-2.563 5.726-5.726 0-3.164-2.562-5.726-5.726-5.726zm0 9.873c-2.122 0-3.957-1.442-4.908-3.55 1.01-2.227 2.87-3.649 4.908-3.649 2.298 0 4.164 1.865 4.164 4.163 0 2.298-1.866 4.164-4.164 4.164zM5.726 15.173c-2.298 0-4.163-1.866-4.163-4.164 0-2.298 1.865-4.163 4.163-4.163 2.038 0 3.897 1.422 4.908 3.65-.95 2.107-2.785 3.55-4.908 3.55z" />
      </svg>
    ),
  },
  {
    name: 'Netflix',
    description: 'Streaming · Engineering excellence',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M5.688 0H1.67v24h4.018V12.016L18.312 24h4.018V0h-4.018v11.984z" />
      </svg>
    ),
  },
  {
    name: 'Stripe',
    description: 'Payments · Developer-first fintech',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M13.926 8.612c0-1.12.92-1.7 2.472-1.7 1.868 0 3.893.58 5.176 1.258l1.04-3.553C21.134 4.02 18.735 3.5 16.516 3.5c-4.453 0-7.393 2.22-7.393 6.02 0 5.86 8.04 4.92 8.04 7.42 0 1.3-.98 1.9-2.71 1.9-2.27 0-4.6-.82-5.94-1.57l-1.07 3.56c1.78.85 4.41 1.42 6.9 1.42 4.69 0 7.69-2.18 7.69-5.93 0-6.17-8.04-5.09-8.04-7.71z" />
      </svg>
    ),
  },
  {
    name: 'Microsoft',
    description: 'Cloud · Enterprise · Developer tools',
    svg: (
      <svg viewBox="0 0 23 23" fill="currentColor" aria-hidden="true">
        <path d="M0 0h11v11H0zM12 0h11v11H12zM0 12h11v11H0zM12 12h11v11H12z" />
      </svg>
    ),
  },
  {
    name: 'Vercel',
    description: 'Frontend infrastructure · Edge network',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 1L24 22H0L12 1z" />
      </svg>
    ),
  },
  {
    name: 'Linear',
    description: 'Issue tracking · Engineering teams',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M3.28 21L21 3.28a1 1 0 011.36 1.47L4.75 22.36A1 1 0 013.28 21zM2 12.87L12.87 2a1 1 0 011.42 1.41L3.41 14.29A1 1 0 012 12.87zM2 19.25l5.25-5.25a1 1 0 111.41 1.42L3.42 20.66A1 1 0 012 19.25z" />
      </svg>
    ),
  },
  {
    name: 'Figma',
    description: 'Design · Collaboration platform',
    svg: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.02s-1.354-3.02-3.019-3.02h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.014-4.49-4.49S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.02s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019H8.148c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h4.588v8.98zM8.148 9.98c-1.665 0-3.019 1.355-3.019 3.02s1.354 3.019 3.019 3.019h3.117V9.98H8.148zm4.587 13.01c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49 4.49 2.014 4.49 4.49-2.014 4.49-4.49 4.49zm0-7.51c-1.665 0-3.019 1.355-3.019 3.02s1.354 3.019 3.019 3.019 3.019-1.354 3.019-3.019-1.354-3.02-3.019-3.02zm6.725-5.5h-.001c-2.476 0-4.49-2.014-4.49-4.49s2.014-4.49 4.49-4.49h.001c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.49-4.49 4.49zm0-7.51c-1.666 0-3.02 1.355-3.02 3.02s1.354 3.019 3.02 3.019h.001c1.665 0 3.019-1.354 3.019-3.019s-1.354-3.02-3.019-3.02h-.001z" />
      </svg>
    ),
  },
];

// ── Logo pill with tooltip ─────────────────────────────────────────────────
function LogoPill({ company, delay, isInView }: {
  company: typeof COMPANIES[0];
  delay: number;
  isInView: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute -top-11 left-1/2 -translate-x-1/2 z-20 pointer-events-none whitespace-nowrap"
          >
            <div className="px-2.5 py-1.5 bg-surface-tile-2 border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.4)] rounded-lg text-[11px] font-mono text-white/65 tracking-tight">
              {company.description}
            </div>
            {/* Arrow */}
            <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-surface-tile-2 border-r border-b border-white/[0.06] rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logo pill */}
      <motion.div
        animate={{
          opacity: hovered ? 1 : 0.3,
          scale: hovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.015] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] cursor-default select-none"
        style={{
          boxShadow: hovered
            ? 'inset 0 1px 0 rgba(255,255,255,0.07), 0 0 20px -6px rgba(41,151,255,0.12)'
            : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <span className="w-4 h-4 text-white/70 flex-shrink-0">
          {company.svg}
        </span>
        <span className="font-display font-semibold text-[13px] tracking-tight text-white/70">
          {company.name}
        </span>
      </motion.div>
    </motion.div>
  );
}

// ── Section export ────────────────────────────────────────────────────────────
export function TrustedBySection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.2 });

  return (
    <section ref={ref}       className="bg-surface-black py-section relative z-10">
      <div className="max-w-[1100px] mx-auto px-6 flex flex-col items-center gap-8">

        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] font-mono font-semibold text-white/25 tracking-tight"
        >
          Empowering engineers at elite tech teams
        </motion.p>

        {/* Logo grid */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {COMPANIES.map((company, i) => (
            <LogoPill
              key={company.name}
              company={company}
              delay={0.05 + i * 0.06}
              isInView={isInView}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
