'use client';

import React, { useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const variants: Variants = {
  initial: { opacity: 0, y: 14, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.35, ease: EASE },
  },
  exit: {
    opacity: 0,
    y: -6,
    filter: 'blur(1px)',
    transition: { duration: 0.18, ease: EASE },
  },
};

export default function PageAnimatePresence({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef(pathname);

  const direction = getDirection(prevPath.current, pathname);
  prevPath.current = pathname;

  const directed: Variants = {
    initial: { opacity: 0, y: direction * 14, filter: 'blur(2px)' },
    animate: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.35, ease: EASE },
    },
    exit: {
      opacity: 0,
      y: direction * -6,
      filter: 'blur(1px)',
      transition: { duration: 0.18, ease: EASE },
    },
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={directed}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full flex-1 flex flex-col min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

const DEPTH: Record<string, number> = {
  '/': 0,
  '/dashboard': 1,
  '/questions': 1,
  '/templates': 1,
  '/settings': 1,
  '/team': 1,
  '/recordings': 1,
  '/pricing': 0,
  '/docs': 0,
  '/support': 0,
  '/auth': 0,
};

function segmentDepth(path: string): number {
  if (DEPTH[path] !== undefined) return DEPTH[path];
  const seg = '/' + path.split('/').filter(Boolean)[0];
  return DEPTH[seg] ?? 1;
}

function getDirection(from: string, to: string): 1 | -1 {
  const dFrom = segmentDepth(from);
  const dTo = segmentDepth(to);
  if (dTo > dFrom) return 1;
  if (dTo < dFrom) return -1;
  return 1;
}
