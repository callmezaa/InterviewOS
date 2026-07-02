'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, Calendar, CheckCircle2, Clock, Mail, ShieldCheck, Sparkles, Target, TrendingUp, TrendingDown, User } from 'lucide-react';
import { useInterviewStore, InterviewDetails } from '../../../store/useInterviewStore';
import { Header } from '../../../components/ui/Header';
import { CandidateProfileSkeleton } from '../../../components/ui/CandidateProfileSkeleton';
import { api } from '../../../lib/api';

const ease = [0.22, 1, 0.36, 1] as const;

function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-400';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-400';
}

export default function CandidateProfile() {
  const params = useParams();
  const { user: currentUser } = useInterviewStore();
  const [interviews, setInterviews] = useState<InterviewDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<InterviewDetails[]>('/interviews')
      .then((data) => setInterviews(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const candidate = currentUser;

  const stats = useMemo(() => {
    const completed = interviews.filter((i) => i.status === 'COMPLETED' && i.feedback?.score !== undefined);
    const total = interviews.length;
    const evaluated = completed.length;
    const avgScore = evaluated > 0 ? Math.round(completed.reduce((s, i) => s + (i.feedback?.score ?? 0), 0) / evaluated) : null;
    const successRate = evaluated > 0 ? Math.round((completed.filter((i) => (i.feedback?.score ?? 0) >= 60).length / evaluated) * 100) : null;

    const sorted = [...completed].sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

    return { total, evaluated, avgScore, successRate, sorted };
  }, [interviews]);

  if (!candidate) {
    return (
      <div className="min-h-screen bg-surface-black text-white flex flex-col items-center justify-center gap-3">
        <User className="w-8 h-8 text-body-muted/50" />
        <p className="text-[14px] text-body-muted/60">Candidate not found</p>
      </div>
    );
  }

  const initial = candidate.name?.charAt(0).toUpperCase() || '?';

  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans selection:bg-primary">
      <Header subTitle="Candidate Profile" />

      <main className="flex-1 max-w-[1100px] w-full mx-auto p-4 sm:p-6 lg:p-10">
        <div className="flex flex-col gap-6">
          {/* ── Profile Hero ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] via-surface-tile-2/40 to-white/[0.01]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-on-dark/30 to-transparent" />

            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5 sm:gap-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/30 to-surface-tile-3 border border-white/[0.08] flex items-center justify-center shrink-0 shadow-lg">
                <span className="text-[28px] sm:text-[34px] font-bold font-display text-white/90">{initial}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1 className="text-[22px] sm:text-[26px] font-bold font-display text-white tracking-tight">
                    {candidate.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border border-primary/20 bg-primary/10 text-[10px] font-semibold text-primary-on-dark font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    {candidate.role === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[13px] text-body-muted/60">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {candidate.email}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Stats Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Sessions', value: stats.total.toString(), icon: Calendar, color: 'text-primary-on-dark' },
              { label: 'Avg Score', value: stats.avgScore !== null ? `${stats.avgScore}%` : '—', icon: Award, color: stats.avgScore !== null ? scoreColor(stats.avgScore) : 'text-body-muted/50' },
              { label: 'Completed', value: stats.evaluated.toString(), icon: CheckCircle2, color: 'text-green-400' },
              { label: 'Success Rate', value: stats.successRate !== null ? `${stats.successRate}%` : '—', icon: TrendingUp, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06, ease }}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-2"
              >
                <div className={`${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <span className="text-[22px] font-bold font-display text-white leading-none tracking-tight">{stat.value}</span>
                <span className="text-[11px] text-body-muted/50 font-mono">{stat.label}</span>
              </motion.div>
            ))}
          </div>

          {/* ── Interview History ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3, ease }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-primary-on-dark" />
              <h2 className="font-display font-semibold text-[15px] text-white">Interview History</h2>
              {loading && <span className="ml-auto text-[11px] text-body-muted/40 font-mono">Loading...</span>}
              {!loading && stats.sorted.length === 0 && <span className="ml-auto text-[11px] text-body-muted/40 font-mono">No sessions yet</span>}
              {!loading && stats.sorted.length > 0 && <span className="ml-auto text-[11px] text-body-muted/40 font-mono">{stats.sorted.length} sessions</span>}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3 p-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-lg bg-white/[0.03] animate-pulse" />
                ))}
              </div>
            ) : stats.sorted.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[14px] text-white/50 font-medium">No interview sessions found</p>
                  <p className="text-[12px] text-body-muted/50 max-w-[300px] leading-relaxed">
                    Complete interviews will appear here with scores, feedback, and performance analytics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {stats.sorted.map((iv, idx) => {
                  const score = iv.feedback?.score ?? 0;
                  const prev = idx < stats.sorted.length - 1 ? stats.sorted[idx + 1]?.feedback?.score : undefined;
                  const up = prev !== undefined && score > prev;
                  const down = prev !== undefined && score < prev;
                  return (
                    <div key={iv.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
                      <div className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${scoreColor(score).replace('text-', 'border-').replace('400', '400/30')} ${scoreColor(score).replace('text-', 'bg-').replace('400', '400/8')}`}>
                        <span className={`text-[14px] font-bold font-mono ${scoreColor(score)}`}>{score}%</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-white truncate">{iv.title}</p>
                        <p className="text-[11px] text-body-muted/50 font-mono mt-0.5">
                          {new Date(iv.scheduledTime).toLocaleDateString()} · {iv.status.toLowerCase()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {up && <TrendingUp className="w-3.5 h-3.5 text-green-400" />}
                        {down && <TrendingDown className="w-3.5 h-3.5 text-red-400" />}
                        <div className="w-20 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${score}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* ── Skills Performance ── */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4, ease }}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
              <Target className="w-4 h-4 text-primary-on-dark" />
              <h2 className="font-display font-semibold text-[15px] text-white">Skills Performance</h2>
              {stats.evaluated > 0 && <span className="ml-auto text-[11px] text-body-muted/40 font-mono">Across {stats.evaluated} {stats.evaluated === 1 ? 'session' : 'sessions'}</span>}
            </div>

            {stats.evaluated === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                  <Award className="w-5 h-5 text-white/20" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-[14px] text-white/50 font-medium">No evaluation data yet</p>
                  <p className="text-[12px] text-body-muted/50 max-w-[300px] leading-relaxed">
                    Skills ratings and performance breakdowns will appear once interviews are evaluated by AI.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-5 flex flex-col gap-4">
                {[
                  { label: 'Technical Skill', key: 'technicalRating' as const, color: 'bg-primary-on-dark' },
                  { label: 'Communication', key: 'communicationRating' as const, color: 'bg-emerald-400' },
                ].map((skill) => {
                  const ratings = stats.sorted
                    .map((i) => i.feedback?.[skill.key])
                    .filter((r): r is number => r !== undefined);
                  const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
                  const pct = (avg / 5) * 100;
                  return (
                    <div key={skill.key} className="flex items-center gap-4">
                      <span className="text-[13px] text-body-muted/70 w-28 shrink-0">{skill.label}</span>
                      <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: 0.5, ease }}
                          className={`h-full rounded-full ${skill.color}`}
                        />
                      </div>
                      <span className="text-[13px] font-mono font-semibold text-white w-8 text-right shrink-0">{avg.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
