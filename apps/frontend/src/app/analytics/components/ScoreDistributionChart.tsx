'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { PieChart } from 'lucide-react';
import { AnalyticsData } from '../../../hooks/useAnalyticsData';

interface ScoreDistributionChartProps {
  data: AnalyticsData;
}

const ease = [0.22, 1, 0.36, 1] as const;

const segments = [
  { key: 'excellent' as const, label: 'Excellent (\u226580)', color: '#34d399', bg: 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400' },
  { key: 'good' as const, label: 'Good (60\u201379)', color: '#fbbf24', bg: 'bg-amber-400/10 border-amber-400/20 text-amber-400' },
  { key: 'needsWork' as const, label: 'Needs Work (<60)', color: '#f87171', bg: 'bg-red-400/10 border-red-400/20 text-red-400' },
];

export function ScoreDistributionChart({ data }: ScoreDistributionChartProps) {
  const total = data.distribution.excellent + data.distribution.good + data.distribution.needsWork;
  const hasData = total > 0;

  const cx = 80;
  const cy = 80;
  const r = 68;
  const circumference = 2 * Math.PI * r;

  const strokes = React.useMemo(() => {
    if (!hasData) return [];
    const vals = [data.distribution.excellent, data.distribution.good, data.distribution.needsWork];
    const sum = vals.reduce((a, b) => a + b, 0);
    let offset = 0;
    return vals.map((v, i) => {
      const length = (v / sum) * circumference;
      const start = offset;
      offset += length;
      return { length, offset: -start, color: segments[i].color, count: v, key: segments[i].key, label: segments[i].label, bg: segments[i].bg };
    });
  }, [data.distribution, hasData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease }}
      className="glow-card p-5 sm:p-6 flex flex-col"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <PieChart className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-[15px] tracking-tight text-white">
          Score Distribution
        </h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <PieChart className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-[14px] text-white/50 font-medium">No evaluations yet</p>
          <p className="text-[12px] text-body-muted/50 max-w-[240px]">
            Complete interviews to see how your scores are distributed.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-6">
            {/* Donut */}
            <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="20" />
              {strokes.map((s) => (
                <motion.circle
                  key={s.key}
                  cx={cx} cy={cy} r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="20"
                  strokeDasharray={`${s.length} ${circumference - s.length}`}
                  strokeDashoffset={s.offset}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: s.offset }}
                  transition={{ duration: 0.8, delay: 0.3, ease }}
                />
              ))}
              <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="24" fontWeight="700" fontFamily="var(--font-display)">
                {total}
              </text>
              <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="11" fontFamily="var(--font-mono)">
                Total
              </text>
            </svg>

            {/* Legend */}
            <div className="flex flex-col gap-2.5">
              {segments.map((seg) => {
                const count = data.distribution[seg.key];
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={seg.key} className="flex items-center gap-2.5 min-w-[140px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                    <div className="flex flex-col">
                      <span className="text-[13px] font-bold font-mono text-white leading-none">{count}</span>
                      <span className="text-[10px] text-body-muted/45 leading-none mt-0.5">{seg.label} · {pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
