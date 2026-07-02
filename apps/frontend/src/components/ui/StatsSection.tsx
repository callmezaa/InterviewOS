'use client';

import { useEffect, useRef, useState } from 'react';
import { Badge } from './Badge';
import { motion } from 'framer-motion';

interface StatItem {
  endValue: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  label: string;
  startDelay: number;
}

const STATS: StatItem[] = [
  { endValue: 10000, suffix: '+',  label: 'Interviews Run',  startDelay: 0   },
  { endValue: 100,   prefix: '< ', suffix: 'ms', label: 'Avg. Latency',  startDelay: 120 },
  { endValue: 99.9,  decimals: 1,  suffix: '%',  label: 'Uptime SLA',    startDelay: 240 },
  { endValue: 4.9,   decimals: 1,  suffix: '★',  label: 'User Rating',   startDelay: 360 },
];

const COUNT_DURATION = 1800; // ms

function Counter({ stat, isTriggered }: { stat: StatItem; isTriggered: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isTriggered || hasStarted.current) return;
    hasStarted.current = true;

    const startTimer = setTimeout(() => {
      startTimeRef.current = null;
      const step = (timestamp: number) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / COUNT_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(eased * stat.endValue);

        if (progress < 1) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          setDisplayValue(stat.endValue);
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
    }, stat.startDelay);

    return () => {
      clearTimeout(startTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isTriggered, stat]);

  const formatted = () => {
    const decimals = stat.decimals ?? 0;
    const raw = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue).toLocaleString();
    return `${stat.prefix ?? ''}${raw}${stat.suffix ?? ''}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isTriggered ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{
        duration: 0.6,
        delay: stat.startDelay / 1000,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      }}
      className="stats-card flex flex-col items-center justify-center gap-2.5 py-12 px-6 cursor-default"
    >
      <span className="font-display font-semibold text-[42px] sm:text-[48px] leading-none tracking-tight text-white transition-all duration-500">
        {formatted()}
      </span>
      <span className="text-[11px] font-mono font-semibold text-white/25 transition-colors duration-300">
        {stat.label}
      </span>
    </motion.div>
  );
}

import { useInView } from 'framer-motion';

export function StatsSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.15 });

  return (
    <section ref={ref}       className="bg-surface-black py-section px-6 sm:px-12">
      <div className="max-w-[1080px] mx-auto flex flex-col gap-16">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center gap-3"
        >
          {/* Badge pill */}
          <Badge>By the numbers</Badge>

          {/* Headline */}
          <h2 className="font-display font-semibold text-[28px] sm:text-[36px] leading-tight tracking-tight text-white mt-1">
            Trusted by teams who ship
          </h2>

          {/* Subtext */}
          <p className="text-body-muted/45 text-[14px] sm:text-[15px] leading-relaxed max-w-[420px] font-sans tracking-tight mt-0.5">
            Real performance metrics from live sessions running on InterviewOS infrastructure.
          </p>

          {/* Hairline divider */}
          <div className="w-[64px] h-px bg-white/[0.08] mt-4" />
        </motion.div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {STATS.map((stat, i) => (
            <Counter key={i} stat={stat} isTriggered={isInView} />
          ))}
        </div>

      </div>
    </section>
  );
}
