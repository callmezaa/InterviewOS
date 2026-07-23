'use client';

import { motion, useInView } from 'motion/react';
import { useRef, ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  /** Stagger delay in seconds */
  delay?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Tailwind/CSS classes applied to the wrapper div */
  className?: string;
  /** Fraction of element that must be visible to trigger (0–1) */
  amount?: number;
}

/**
 * A lightweight scroll-triggered reveal wrapper.
 * Above-the-fold elements animate in on page load.
 * Below-the-fold elements animate in as they scroll into view.
 * Each element only animates once (once: true).
 */
export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  duration = 0.6,
  className = '',
  amount = 0.15,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{
        duration,
        delay,
        // Premium ease-out-quint — same curve Apple uses for spring-like motion
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
};
