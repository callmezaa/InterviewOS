'use client';

import React from 'react';
import { Video, Target, CheckCircle2, Zap } from 'lucide-react';
import { motion } from 'motion/react';
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
        trend={stats.scheduled > 0 ? `+${stats.scheduled}` : undefined}
        trendUp={true}
        delay={0}
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
        delay={1}
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
        trend={stats.successRate >= 70 ? 'Passing' : stats.completed > 0 ? 'Low' : undefined}
        trendUp={stats.successRate >= 70}
        delay={2}
      />

      <MetricCard
        label="Active Now"
        value={stats.active.toString()}
        sub={stats.active > 0 ? 'live session in progress' : 'no live rooms right now'}
        icon={
          <span className="relative flex items-center justify-center w-4 h-4">
            <Zap className="w-4 h-4 relative text-primary-on-dark" />
          </span>
        }
        trend={stats.active > 0 ? 'LIVE' : undefined}
        trendUp={true}
        delay={3}
      />
    </motion.div>
  );
}
