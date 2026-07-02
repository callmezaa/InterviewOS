import { useState, useEffect } from 'react';
import type { Variants, Transition } from 'framer-motion';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = ({ matches }: MediaQueryListEvent) => setReduced(matches);
    handler({ matches: mq.matches } as MediaQueryListEvent);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

export const ease = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = {
  duration: 0.25,
  ease: ease as [number, number, number, number],
};

export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: 0.2, ease: ease as [number, number, number, number] } },
  whileTap: { scale: 0.97, transition: { duration: 0.1, ease: ease as [number, number, number, number] } },
};

export const cardHover = {
  whileHover: {
    y: -2,
    transition: { duration: 0.25, ease: ease as [number, number, number, number] },
  },
  whileTap: { scale: 0.99 },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ease as [number, number, number, number] },
  },
};

export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: ease as [number, number, number, number] },
  },
};
