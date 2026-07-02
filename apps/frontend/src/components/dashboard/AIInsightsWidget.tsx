'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Award, TrendingUp, TrendingDown, Eye, Sparkles } from 'lucide-react';
import type { InterviewDetails } from '../../store/useInterviewStore';

interface AIInsightsWidgetProps {
  interviews: InterviewDetails[];
  onViewLatestReview: (interview: InterviewDetails) => void;
}

const ease = [0.22, 1, 0.36, 1] as const;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-green-400/10 border-green-400/20';
  if (score >= 60) return 'bg-amber-400/10 border-amber-400/20';
  return 'bg-red-400/10 border-red-400/20';
}

function scoreGlow(score: number): string {
  if (score >= 80) return 'shadow-[0_0_20px_color-mix(in_srgb,var(--color-success)_15%,transparent)]';
  if (score >= 60) return 'shadow-[0_0_20px_color-mix(in_srgb,var(--color-warning)_15%,transparent)]';
  return 'shadow-[0_0_20px_color-mix(in_srgb,var(--color-danger-soft)_15%,transparent)]';
}

export function AIInsightsWidget({ interviews, onViewLatestReview }: AIInsightsWidgetProps) {
  const insights = useMemo(() => {
    const completed = interviews.filter(
      (i) => i.status === 'COMPLETED' && i.feedback?.score !== undefined
    );

    const evaluatedCount = completed.length;
    const totalScore = completed.reduce((sum, i) => sum + (i.feedback?.score ?? 0), 0);
    const avgScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : null;

    const sorted = [...completed].sort(
      (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
    );

    const recentScores = sorted.slice(0, 5).map((i) => ({
      id: i.id,
      title: i.title,
      score: i.feedback?.score ?? 0,
      date: i.scheduledTime,
    }));

    const latestReview = sorted[0] ?? null;
    const excellent = completed.filter((i) => (i.feedback?.score ?? 0) >= 80).length;
    const good = completed.filter(
      (i) => (i.feedback?.score ?? 0) >= 60 && (i.feedback?.score ?? 0) < 80
    ).length;
    const needsWork = completed.filter((i) => (i.feedback?.score ?? 0) < 60).length;

    const prevScore = sorted.length > 1 ? sorted[1]?.feedback?.score : undefined;
    const trend = prevScore !== undefined && avgScore !== null ? avgScore - prevScore : null;

    return { evaluatedCount, avgScore, recentScores, latestReview, excellent, good, needsWork, trend };
  }, [interviews]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15, ease }}
      className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] via-surface-tile-2/40 to-white/[0.01]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-on-dark/40 to-transparent" />

      <div className="p-5 sm:p-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-on-dark" />
            </div>
            <h3 className="font-display font-semibold text-[15px] tracking-tight text-white">
              AI Insights
            </h3>
          </div>
          {insights.evaluatedCount > 0 && (
            <span className="text-[11px] text-body-muted/50 font-mono">
              {insights.evaluatedCount} evaluated
            </span>
          )}
        </div>

        {insights.evaluatedCount === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <Award className="w-5 h-5 text-white/20" />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-[14px] text-white/50 font-medium">No evaluations yet</p>
              <p className="text-[12px] text-body-muted/50 max-w-[280px] leading-relaxed">
                Complete interviews with AI evaluation to see analytical insights and trends here.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* ── Main Row: Score | Bar Chart | Distribution ── */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-start">
              {/* Average Score */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.25, ease }}
                className={`flex flex-col items-center sm:items-start ${scoreColor(insights.avgScore ?? 0)}`}
              >
                <span className="text-[11px] text-body-muted/55 font-mono font-semibold mb-1">
                  Average Score
                </span>
                <span className="text-[44px] sm:text-[52px] font-bold tracking-tight font-display leading-none">
                  {insights.avgScore}%
                </span>
                {insights.trend !== null && (
                  <span className={`flex items-center gap-1 text-[12px] font-mono mt-1.5 ${insights.trend >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}>
                    {insights.trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {insights.trend >= 0 ? '+' : ''}{insights.trend} pts
                    <span className="text-body-muted/40 text-[10px] ml-0.5">vs previous</span>
                  </span>
                )}
              </motion.div>

              {/* Mini Bar Chart */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35, ease }}
                className="flex-1 w-full"
              >
                <div className="flex items-end gap-1.5 h-20">
                  {insights.recentScores.slice(0, 8).map((s, i) => (
                    <motion.div
                      key={s.id}
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(20, (s.score / 100) * 72)}%` }}
                      transition={{ duration: 0.6, delay: 0.4 + i * 0.06, ease }}
                      className={`flex-1 rounded-t-sm ${scoreBg(s.score)} border ${scoreGlow(s.score)}`}
                      title={`${s.title}: ${s.score}%`}
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10px] text-body-muted/40 font-mono">Recent</span>
                  <span className="text-[10px] text-body-muted/40 font-mono">Newest</span>
                </div>
              </motion.div>

              {/* Distribution Chips */}
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.45, ease }}
                className="flex sm:flex-col gap-2"
              >
                {[
                  { label: '≥80', count: insights.excellent, color: 'text-green-400', border: 'border-green-400/20 bg-green-400/8' },
                  { label: '60-79', count: insights.good, color: 'text-amber-400', border: 'border-amber-400/20 bg-amber-400/8' },
                  { label: '<60', count: insights.needsWork, color: 'text-red-400', border: 'border-red-400/20 bg-red-400/8' },
                ].map((b) => (
                  <div
                    key={b.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${b.border} min-w-[90px]`}
                  >
                    <span className={`text-[20px] font-bold font-display leading-none ${b.color}`}>{b.count}</span>
                    <span className="text-[10px] font-mono text-body-muted/55">{b.label}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── Divider ── */}
            <div className="my-4 h-px bg-white/[0.04]" />

            {/* ── Bottom Row: Recent Scores + CTA ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              {insights.recentScores.length > 0 && (
                <div className="flex-1 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                  <span className="text-[10px] text-body-muted/50 font-mono font-semibold tracking-wider uppercase">Recent</span>
                  {insights.recentScores.slice(0, 4).map((s, idx) => {
                    const next = idx < insights.recentScores.length - 1 ? insights.recentScores[idx + 1]?.score : undefined;
                    const up = next !== undefined && s.score > next;
                    const down = next !== undefined && s.score < next;
                    return (
                      <div key={s.id} className="flex items-center gap-1.5">
                        <span className={`text-[13px] font-bold font-mono ${scoreColor(s.score)}`}>{s.score}%</span>
                        <span className="text-[11px] text-white/50 truncate max-w-[120px]">{s.title}</span>
                        {up && <TrendingUp className="w-3 h-3 text-green-400 shrink-0" />}
                        {down && <TrendingDown className="w-3 h-3 text-red-400 shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {insights.latestReview && (
                <button
                  onClick={() => onViewLatestReview(insights.latestReview!)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 text-primary-on-dark text-[12px] font-semibold hover:bg-primary/10 hover:border-primary/30 transition-all shrink-0"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Latest Review
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
