'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';
import { useAnalyticsData, TimePeriod } from '../../hooks/useAnalyticsData';
import { PerformanceSummary } from './components/PerformanceSummary';
import { ScoreTrendChart } from './components/ScoreTrendChart';
import { ScoreDistributionChart } from './components/ScoreDistributionChart';
import { SkillBreakdownChart } from './components/SkillBreakdownChart';
import { EvaluationTable } from './components/EvaluationTable';

const periods: { value: TimePeriod; label: string }[] = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All Time' },
];

export default function AnalyticsPage() {
  const { data, loading, period, setPeriod } = useAnalyticsData();

  return (
    <div className="min-h-screen bg-surface-black text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <BarChart3 className="w-4.5 h-4.5 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-[22px] sm:text-h2 tracking-tight text-white">
                Analytics
              </h1>
              <p className="text-[13px] text-body-muted/50 mt-0.5">
                Performance metrics and evaluation insights
              </p>
            </div>
          </div>

          {/* Period selector */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {periods.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-200 ${
                  period === p.value
                    ? 'bg-primary/15 text-primary border border-primary/25 shadow-[0_1px_4px_-1px_var(--color-primary-glow)]'
                    : 'text-body-muted/50 hover:text-white/70'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <AnalyticsSkeleton />
        ) : (
          <div className="flex flex-col gap-4">
            <PerformanceSummary data={data} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <ScoreTrendChart data={data} />
              </div>
              <div>
                <ScoreDistributionChart data={data} />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <SkillBreakdownChart data={data} />
              <EvaluationTable data={data} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
            <div className="w-4 h-4 rounded bg-white/[0.06] mb-3" />
            <div className="w-16 h-3 rounded bg-white/[0.06] mb-2" />
            <div className="w-24 h-7 rounded bg-white/[0.06] mb-1.5" />
            <div className="w-32 h-3 rounded bg-white/[0.06]" />
            <div className="w-full h-[3px] rounded-full bg-white/[0.04] mt-3" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[260px]" />
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[260px]" />
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[320px]" />
        <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[320px]" />
      </div>
    </div>
  );
}
