'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  progress?: number;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
  sparklineData?: number[];
  sparklineColor?: string;
}

export function MetricCard({
  label, value, sub, icon,
  progress, trend, trendUp, delay = 0,
  sparklineData, sparklineColor,
}: MetricCardProps) {
  const [displayed, setDisplayed] = useState('0');

  useEffect(() => {
    const numericVal = parseFloat(value.replace(/[^0-9.]/g, ''));
    const suffix = value.replace(/[0-9.]/g, '');
    if (isNaN(numericVal) || numericVal === 0) { setDisplayed(value); return; }

    const duration = 900 + delay * 200;
    const steps = 40;
    const stepMs = duration / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - (step / steps), 3);
      const current = numericVal * eased;
      const formatted = Number.isInteger(numericVal)
        ? Math.round(current).toString()
        : current.toFixed(1);
      setDisplayed(formatted + suffix);
      if (step >= steps) clearInterval(interval);
    }, stepMs);

    return () => clearInterval(interval);
  }, [value, delay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="glow-card flex flex-col gap-3 p-4 cursor-default select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-shrink-0 text-primary-on-dark">
          {icon}
        </div>

        {trend && (
          <Badge variant={trendUp ? 'primary' : 'neutral'} size="sm">
            <TrendingUp className={`w-2.5 h-2.5 ${trendUp ? '' : 'rotate-180'}`} />
            {trend}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-body-muted/45 font-mono font-semibold leading-none">
          {label}
        </span>
        <span className="text-[28px] font-bold tracking-tight leading-none font-display text-white">
          {displayed}
        </span>
        <span className="text-[11px] text-body-muted/55 leading-none mt-0.5">{sub}</span>
      </div>

      {progress !== undefined && (
        <div className="mt-auto">
          <div className="w-full h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-primary/60"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress, 100)}%` }}
              transition={{ duration: 1.1, delay: delay * 0.08 + 0.3, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      )}

      {sparklineData && sparklineData.length >= 2 && (
        <Sparkline data={sparklineData} color={sparklineColor} delay={delay} />
      )}
    </motion.div>
  );
}

/* ── Inline SVG Sparkline ───────────────────────────────────── */

interface SparklineProps {
  data: number[];
  color?: string;
  delay?: number;
}

function Sparkline({ data, color = 'var(--color-primary-on-dark)', delay = 0 }: SparklineProps) {
  const id = useMemo(() => `spark-${Math.random().toString(36).slice(2, 8)}`, []);

  const width = 200;
  const height = 32;
  const padding = 2;

  const { path, fillPath } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const xStep = (width - padding * 2) / (data.length - 1);

    let line = '';
    data.forEach((val, i) => {
      const x = padding + i * xStep;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      line += i === 0 ? `M${x},${y}` : `L${x},${y}`;
    });

    const bottom = height - padding;
    const fill = `${line} L${padding + (data.length - 1) * xStep},${bottom} L${padding},${bottom} Z`;

    return { path: line, fillPath: fill };
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-[32px] -mx-0.5"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      <motion.path
        d={fillPath}
        fill={`url(#${id}-grad)`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: delay * 0.08 + 0.4 }}
      />

      <motion.path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.8, delay: delay * 0.08 + 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}
