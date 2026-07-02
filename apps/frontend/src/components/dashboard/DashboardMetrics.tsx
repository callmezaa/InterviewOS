'use client';

import React from 'react';
import { Video, Target, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { MetricCard } from './MetricCard';

interface InterviewerStats {
  total: number;
  active: number;
  completed: number;
  scheduled: number;
  avgTechnical: number;
  successRate: number;
  withFeedback: number;
  avgScore: number;
}

interface DashboardMetricsProps {
  stats: InterviewerStats;
}

export function DashboardMetrics({ stats }: DashboardMetricsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3"
    >
      <MetricCard
        label="Total Rooms"
        value={stats.total.toString()}
        sub={`${stats.scheduled} upcoming`}
        icon={<Video className="w-4 h-4 text-primary-on-dark" />}
        progress={stats.total > 0 ? Math.min((stats.total / 20) * 100, 100) : 0}
        trend={stats.scheduled > 0 ? `+${stats.scheduled}` : undefined}
        trendUp={true}
        delay={0}
        sparklineData={[3, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15]}
        sparklineColor="var(--color-primary-on-dark)"
      />

      <MetricCard
        label="Avg Technical"
        value={stats.avgTechnical > 0 ? `${stats.avgTechnical.toFixed(1)}/5` : '—'}
        sub={
          stats.withFeedback > 0
            ? `across ${stats.withFeedback} ${stats.withFeedback === 1 ? 'session' : 'sessions'}`
            : 'no scored sessions yet'
        }
        icon={<Target className="w-4 h-4 text-primary-on-dark" />}
        progress={stats.avgTechnical > 0 ? (stats.avgTechnical / 5) * 100 : 0}
        delay={1}
        sparklineData={[2.8, 3.1, 3.0, 3.4, 3.6, 3.5, 3.8, 4.0, 3.9, 4.1, 4.0, 4.2]}
        sparklineColor="var(--color-primary-on-dark)"
      />

      <MetricCard
        label="Success Rate"
        value={stats.completed > 0 ? `${stats.successRate}%` : '—'}
        sub={
          stats.completed > 0
            ? stats.withFeedback > 0 && stats.avgScore > 0
              ? `${stats.completed} completed · ${stats.avgScore}% avg`
              : `${stats.completed} completed total`
            : 'complete sessions to track'
        }
        icon={<CheckCircle2 className="w-4 h-4 text-primary-on-dark" />}
        progress={stats.successRate}
        trend={stats.successRate >= 70 ? 'Passing' : stats.completed > 0 ? 'Low' : undefined}
        trendUp={stats.successRate >= 70}
        delay={2}
        sparklineData={[45, 52, 48, 58, 63, 61, 68, 72, 70, 75, 73, 78]}
        sparklineColor="var(--color-success)"
      />

      <div className="relative">
        <div className="absolute -inset-px rounded-lg bg-primary/10 border border-primary/20 pointer-events-none" />
        <MetricCard
          label="Active Now"
          value={stats.active.toString()}
          sub={stats.active > 0 ? 'live session in progress' : 'no live rooms right now'}
          icon={
            <span className="relative flex items-center justify-center w-4 h-4">
              {stats.active > 0 && (
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary-on-dark opacity-40 animate-ping" />
              )}
              <Zap className="w-4 h-4 relative text-primary-on-dark" />
            </span>
          }
          progress={stats.total > 0 ? (stats.active / stats.total) * 100 : 0}
          trend={stats.active > 0 ? 'LIVE' : undefined}
          trendUp={true}
          delay={3}
          sparklineData={[0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6]}
          sparklineColor="var(--color-primary)"
        />
      </div>
    </motion.div>
  );
}
