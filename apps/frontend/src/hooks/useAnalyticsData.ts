'use client';

import { useState, useEffect, useMemo } from 'react';
import { useInterviewStore, InterviewDetails } from '../store/useInterviewStore';
import { API_URL } from '../lib/config';

export type TimePeriod = '7d' | '30d' | 'all';

export interface AnalyticsData {
  totalInterviews: number;
  completedCount: number;
  avgScore: number | null;
  avgTechnical: number | null;
  avgCommunication: number | null;
  completionRate: number;
  successRate: number;
  scoreHistory: { date: string; score: number; title: string; id: string }[];
  distribution: { excellent: number; good: number; needsWork: number };
  activity: { date: string; count: number }[];
  evaluations: {
    id: string;
    title: string;
    date: string;
    score: number;
    technicalRating: number;
    communicationRating: number;
  }[];
  trend: number | null;
}

function filterByPeriod(interviews: InterviewDetails[], period: TimePeriod): InterviewDetails[] {
  if (period === 'all') return interviews;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (period === '7d' ? 7 : 30));
  return interviews.filter((i) => new Date(i.scheduledTime) >= cutoff);
}

function computeAnalytics(interviews: InterviewDetails[]): AnalyticsData {
  const total = filterByPeriod(interviews, 'all');
  const completed = total.filter((i) => i.status === 'COMPLETED' && i.feedback?.score !== undefined);
  const active = total.filter((i) => i.status === 'ACTIVE');
  const scheduled = total.filter((i) => i.status === 'SCHEDULED');

  const evaluatedCount = completed.length;
  const totalScore = completed.reduce((sum, i) => sum + (i.feedback?.score ?? 0), 0);
  const avgScore = evaluatedCount > 0 ? Math.round(totalScore / evaluatedCount) : null;
  const totalTechnical = completed.reduce((sum, i) => sum + (i.feedback?.technicalRating ?? 0), 0);
  const avgTechnical = evaluatedCount > 0 ? totalTechnical / evaluatedCount : null;
  const totalComm = completed.reduce((sum, i) => sum + (i.feedback?.communicationRating ?? 0), 0);
  const avgCommunication = evaluatedCount > 0 ? totalComm / evaluatedCount : null;

  const completionRate = total.length > 0 ? Math.round((completed.length / total.length) * 100) : 0;
  const successCount = completed.filter((i) => (i.feedback?.score ?? 0) >= 70).length;
  const successRate = evaluatedCount > 0 ? Math.round((successCount / evaluatedCount) * 100) : 0;

  const sortedByDate = [...completed].sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );

  const scoreHistory = sortedByDate.map((i) => ({
    date: i.scheduledTime,
    score: i.feedback!.score,
    title: i.title,
    id: i.id,
  }));

  const excellent = completed.filter((i) => (i.feedback?.score ?? 0) >= 80).length;
  const good = completed.filter((i) => {
    const s = i.feedback?.score ?? 0;
    return s >= 60 && s < 80;
  }).length;
  const needsWork = completed.filter((i) => (i.feedback?.score ?? 0) < 60).length;

  // Activity: group interviews by day
  const activityMap = new Map<string, number>();
  total.forEach((i) => {
    const day = new Date(i.scheduledTime).toISOString().slice(0, 10);
    activityMap.set(day, (activityMap.get(day) || 0) + 1);
  });
  const activity = Array.from(activityMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const evaluations = sortedByDate
    .reverse()
    .map((i) => ({
      id: i.id,
      title: i.title,
      date: i.scheduledTime,
      score: i.feedback!.score,
      technicalRating: i.feedback!.technicalRating,
      communicationRating: i.feedback!.communicationRating,
    }));

  const sortedDesc = [...completed].sort(
    (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
  );
  const prevScore = sortedDesc.length > 1 ? sortedDesc[1]?.feedback?.score : undefined;
  const trend = prevScore !== undefined && avgScore !== null ? avgScore - prevScore : null;

  return {
    totalInterviews: total.length,
    completedCount: evaluatedCount,
    avgScore,
    avgTechnical,
    avgCommunication,
    completionRate,
    successRate,
    scoreHistory,
    distribution: { excellent, good, needsWork },
    activity,
    evaluations,
    trend,
  };
}

export function useAnalyticsData() {
  const { user } = useInterviewStore();
  const [interviews, setInterviews] = useState<InterviewDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<TimePeriod>('all');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`${API_URL}/interviews`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => setInterviews(data))
      .catch(() => setInterviews([]))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => filterByPeriod(interviews, period), [interviews, period]);
  const data = useMemo(() => computeAnalytics(filtered), [filtered]);

  return { data, loading, period, setPeriod };
}
