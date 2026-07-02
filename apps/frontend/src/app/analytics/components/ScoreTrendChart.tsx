'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AnalyticsData } from '../../../hooks/useAnalyticsData';

interface ScoreTrendChartProps {
  data: AnalyticsData;
}

const ease = [0.22, 1, 0.36, 1] as const;
const W = 600;
const H = 200;
const P = 24;

function scoreColor(s: number): string {
  if (s >= 80) return 'var(--color-success)';
  if (s >= 60) return 'var(--color-warning)';
  return 'var(--color-danger-soft)';
}

function scoreCssClass(s: number): string {
  if (s >= 80) return 'text-emerald-400';
  if (s >= 60) return 'text-amber-400';
  return 'text-red-400';
}

export function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  const { pathDefs, dots, domain, range } = useMemo(() => {
    const scores = data.scoreHistory;
    if (scores.length < 2) return { pathDefs: [], dots: [], domain: { min: 0, max: 100 }, range: { min: 0, max: 0 } };

    const vals = scores.map((s) => s.score);
    const min = Math.min(...vals, 0);
    const max = Math.max(...vals, 100);
    const xStep = (W - P * 2) / (scores.length - 1);

    const dots = scores.map((s, i) => ({
      x: P + i * xStep,
      y: H - P - ((s.score - min) / (max - min)) * (H - P * 2),
      ...s,
      color: scoreCssClass(s.score),
    }));

    const pathDefs = [
      dots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x},${d.y}`).join(' '),
      `${dots.map((d, i) => `${i === 0 ? 'M' : 'L'}${d.x},${d.y}`).join(' ')} L${dots[dots.length - 1].x},${H - P} L${dots[0].x},${H - P} Z`,
    ];

    return { pathDefs, dots, domain: { min, max }, range: { min: scores[0].score, max: scores[scores.length - 1].score } };
  }, [data.scoreHistory]);

  const hasData = data.evaluations.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease }}
      className="glow-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
          </div>
          <h3 className="font-display font-semibold text-[15px] tracking-tight text-white">
            Score Trend
          </h3>
        </div>
        {data.avgScore !== null && (
          <span className={`text-[13px] font-bold font-mono ${scoreCssClass(data.avgScore)}`}>
            {data.avgScore}% avg
          </span>
        )}
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-[14px] text-white/50 font-medium">No evaluations yet</p>
          <p className="text-[12px] text-body-muted/50 max-w-[280px]">
            Complete interviews with AI evaluation to see score trends.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-6 w-8 flex flex-col justify-between text-[10px] font-mono text-body-muted/30 pointer-events-none">
            <span>{domain.max}</span>
            <span>{Math.round((domain.max + domain.min) / 2)}</span>
            <span>{domain.min}</span>
          </div>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-[180px]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Grid lines */}
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={P} y1={P + (H - P * 2) * ratio}
                x2={W - P} y2={P + (H - P * 2) * ratio}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Fill area */}
            <defs>
              <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <motion.path
              d={pathDefs[1]}
              fill="url(#trend-fill)"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            />

            {/* Line */}
            <motion.path
              d={pathDefs[0]}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.4, ease }}
            />

            {/* Dots */}
            {dots.map((d, i) => (
              <motion.g
                key={d.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.5 + i * 0.04 }}
              >
                <circle cx={d.x} cy={d.y} r="4" fill="var(--color-surface-black)" stroke={d.score >= 80 ? 'var(--color-success)' : d.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger-soft)'} strokeWidth="2" />
              </motion.g>
            ))}
          </svg>

          {/* X-axis labels (first, middle, last) */}
          {data.scoreHistory.length >= 2 && (
            <div className="flex justify-between mt-1 text-[10px] font-mono text-body-muted/30">
              <span>{new Date(data.scoreHistory[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              {data.scoreHistory.length > 2 && (
                <span>{new Date(data.scoreHistory[Math.floor(data.scoreHistory.length / 2)].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              )}
              <span>{new Date(data.scoreHistory[data.scoreHistory.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
