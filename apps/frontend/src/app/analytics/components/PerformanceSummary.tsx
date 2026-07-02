'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Video, Target, BarChart3, Award } from 'lucide-react';
import { AnalyticsData } from '../../../hooks/useAnalyticsData';

interface PerformanceSummaryProps {
  data: AnalyticsData;
}

const ease = [0.22, 1, 0.36, 1] as const;

function AnimatedValue({ value, suffix }: { value: string | number; suffix?: string }) {
  const [displayed, setDisplayed] = React.useState('0');
  const finalStr = typeof value === 'number' ? value.toFixed(1) : value;

  React.useEffect(() => {
    const numericVal = parseFloat(finalStr);
    if (isNaN(numericVal)) { setDisplayed(finalStr); return; }
    const steps = 30;
    const stepMs = 600 / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      const eased = 1 - Math.pow(1 - step / steps, 3);
      const current = numericVal * eased;
      setDisplayed(Number.isInteger(numericVal) ? Math.round(current).toString() : current.toFixed(1));
      if (step >= steps) clearInterval(interval);
    }, stepMs);
    return () => clearInterval(interval);
  }, [finalStr]);

  return (
    <span>
      {displayed}{suffix}
    </span>
  );
}

const cards: {
  label: string;
  getValue: (d: AnalyticsData) => string;
  getSub: (d: AnalyticsData) => string;
  icon: React.ComponentType<{ className?: string }>;
  getProgress: (d: AnalyticsData) => number;
  color: string | ((d: AnalyticsData) => string);
  delay: number;
}[] = [
  {
    label: 'Total Interviews',
    getValue: (d: AnalyticsData) => d.totalInterviews.toString(),
    getSub: (d: AnalyticsData) => `${d.completedCount} completed · ${d.totalInterviews - d.completedCount} pending`,
    icon: Video,
    getProgress: (d: AnalyticsData) => d.totalInterviews > 0 ? (d.completedCount / d.totalInterviews) * 100 : 0,
    color: 'text-primary',
    delay: 0,
  },
  {
    label: 'Average Score',
    getValue: (d: AnalyticsData) => d.avgScore !== null ? `${d.avgScore}%` : '\u2014',
    getSub: (d: AnalyticsData) => {
      if (d.evaluations.length === 0) return 'no evaluations yet';
      const t = d.trend;
      if (t === null) return 'first evaluation recorded';
      return `${t >= 0 ? '+' : ''}${t} pts vs previous`;
    },
    icon: Target,
    getProgress: (d: AnalyticsData) => d.avgScore ?? 0,
    color: d => {
      if (d.avgScore === null) return 'text-body-muted/50';
      return d.avgScore >= 80 ? 'text-emerald-400' : d.avgScore >= 60 ? 'text-amber-400' : 'text-red-400';
    },
    delay: 1,
  },
  {
    label: 'Completion Rate',
    getValue: (d: AnalyticsData) => `${d.completionRate}%`,
    getSub: (d: AnalyticsData) => `${d.completedCount} of ${d.totalInterviews} sessions completed`,
    icon: BarChart3,
    getProgress: (d: AnalyticsData) => d.completionRate,
    color: d => d.completionRate >= 60 ? 'text-emerald-400' : d.completionRate >= 30 ? 'text-amber-400' : 'text-red-400',
    delay: 2,
  },
  {
    label: 'Success Rate',
    getValue: (d: AnalyticsData) => d.evaluations.length > 0 ? `${d.successRate}%` : '\u2014',
    getSub: (d: AnalyticsData) => {
      if (d.evaluations.length === 0) return 'complete sessions to track';
      return `${d.distribution.excellent + d.distribution.good} of ${d.evaluations.length} passing (≥70)`;
    },
    icon: Award,
    getProgress: (d: AnalyticsData) => d.successRate,
    color: d => d.successRate >= 70 ? 'text-emerald-400' : d.successRate >= 40 ? 'text-amber-400' : 'text-red-400',
    delay: 3,
  },
];

export function PerformanceSummary({ data }: PerformanceSummaryProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const color = typeof card.color === 'function' ? card.color(data) : card.color;
        return (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: card.delay * 0.08, ease }}
            className="glow-card flex flex-col gap-3 p-4 cursor-default select-none"
          >
            <div className="flex items-start justify-between">
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-body-muted/45 font-mono font-semibold leading-none">
                {card.label}
              </span>
              <span className={`text-[28px] font-bold tracking-tight leading-none font-display ${color}`}>
                <AnimatedValue value={card.getValue(data)} />
              </span>
              <span className="text-[11px] text-body-muted/55 leading-none mt-0.5">
                {card.getSub(data)}
              </span>
            </div>
            <div className="w-full h-[3px] bg-white/[0.05] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary/60"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(card.getProgress(data), 100)}%` }}
                transition={{ duration: 1.1, delay: card.delay * 0.08 + 0.3, ease }}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
