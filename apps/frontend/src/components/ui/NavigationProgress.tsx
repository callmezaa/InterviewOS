'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const [width, setWidth] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setVisible(true);
    setWidth(0);

    const t1 = setTimeout(() => setWidth(30), 40);
    const t2 = setTimeout(() => setWidth(65), 180);
    const t3 = setTimeout(() => setWidth(90), 350);
    const t4 = setTimeout(() => {
      setWidth(100);
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 350);
    }, 550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [pathname, searchParams]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed top-0 left-0 z-[9999] flex h-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } }}
          style={{ width: `${width}%` }}
        >
          <div
            className="h-full w-full bg-primary"
            style={{
              boxShadow: 'var(--shadow-progress-glow)',
            }}
          />
          <div
            className="absolute right-0 top-0 h-full w-8 -translate-y-0 blur-sm"
            style={{
              background: 'var(--gradient-progress-glow)',
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
