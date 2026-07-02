'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { AnalyticsData } from '../../../hooks/useAnalyticsData';

interface SkillBreakdownChartProps {
  data: AnalyticsData;
}

const ease = [0.22, 1, 0.36, 1] as const;
const BAR_H = 36;
const MAX_RATING = 5;

export function SkillBreakdownChart({ data }: SkillBreakdownChartProps) {
  const evals = data.evaluations;
  const hasData = evals.length > 0;

  // Show the 8 most recent evaluations
  const items = useMemo(() => {
    return evals.slice(0, 8).reverse();
  }, [evals]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25, ease }}
      className="glow-card p-5 sm:p-6"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart3 className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-[15px] tracking-tight text-white">
          Skill Breakdown
        </h3>
        <div className="ml-auto flex items-center gap-3 text-[10px] font-mono text-body-muted/40">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-primary" />
            Technical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-amber-400" />
            Communication
          </span>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-[14px] text-white/50 font-medium">No evaluations yet</p>
          <p className="text-[12px] text-body-muted/50 max-w-[280px]">
            Complete interviews to see a breakdown of technical vs communication ratings.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => {
            const techPct = (item.technicalRating / MAX_RATING) * 100;
            const commPct = (item.communicationRating / MAX_RATING) * 100;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.04, ease }}
                className="flex flex-col gap-1 py-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/70 truncate max-w-[200px]">{item.title}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-primary font-semibold w-6 text-right">{item.technicalRating.toFixed(1)}</span>
                    <span className="text-[11px] font-mono text-amber-400 font-semibold w-6 text-right">{item.communicationRating.toFixed(1)}</span>
                    <span className={`text-[11px] font-mono font-semibold w-8 text-right ${
                      item.score >= 80 ? 'text-emerald-400' : item.score >= 60 ? 'text-amber-400' : 'text-red-400'
                    }`}>{item.score}%</span>
                  </div>
                </div>
                <div className="relative h-4 bg-white/[0.04] rounded-full overflow-hidden">
                  {/* Communication bar (back) */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-amber-400/40"
                    initial={{ width: 0 }}
                    animate={{ width: `${commPct}%` }}
                    transition={{ duration: 0.7, delay: 0.2 + i * 0.04, ease }}
                  />
                  {/* Technical bar (front) */}
                  <motion.div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/60"
                    initial={{ width: 0 }}
                    animate={{ width: `${techPct}%` }}
                    transition={{ duration: 0.7, delay: 0.3 + i * 0.04, ease }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
