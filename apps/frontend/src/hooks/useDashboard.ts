'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInterviewStore, InterviewDetails } from '../store/useInterviewStore';
import { toast } from '../store/useToastStore';
import { useActionHistory } from '../store/useActionHistoryStore';
import { API_URL } from '../lib/config';
import { authFetch } from '../lib/authFetch';
import { fetchTemplate } from '../lib/templates';
import { isGuest } from '../lib/guest';

const DEMO_INTERVIEWS: InterviewDetails[] = [
  {
    id: 'demo_system_design_lead',
    title: 'System Design — Distributed Cache Layer',
    description: 'Evaluating candidate\'s ability to design a horizontally-scalable Redis-based caching strategy with TTL invalidation policies.',
    candidateEmail: 'alex.chen@techcorp.io',
    status: 'COMPLETED',
    scheduledTime: new Date(Date.now() - 5 * 86_400_000).toISOString(),
    codeContent: '// Redis Cache Strategy\nconst cache = new RedisClient({ host: process.env.REDIS_HOST });',
    language: 'typescript',
    transcript: [
      { speakerName: 'Interviewer', text: 'Walk me through how you would handle cache invalidation at scale.', timestamp: '09:02' },
    ],
    codeHistory: [],
    feedback: { score: 92, technicalRating: 4.9, communicationRating: 4.5, summary: 'Exceptional architectural understanding.', detailedReview: '### Strengths\n- Correctly identified write-through vs write-behind tradeoffs.' },
  },
  {
    id: 'demo_react_perf_audit',
    title: 'React Performance & Bundle Optimization',
    description: 'Deep-dive into code-splitting, memoization patterns, and React 18 concurrent rendering features.',
    candidateEmail: 'priya.sharma@frontend.dev',
    status: 'COMPLETED',
    scheduledTime: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    codeContent: 'import { memo, useDeferredValue, useTransition } from \'react\';',
    language: 'typescript',
    transcript: [],
    codeHistory: [],
    feedback: { score: 78, technicalRating: 4.1, communicationRating: 4.6, summary: 'Strong conceptual grasp of React 18 concurrency.', detailedReview: '### Strengths\n- Correctly used useDeferredValue vs debounce.' },
  },
  {
    id: 'demo_node_stream_live',
    title: 'Node.js Streams & Backpressure Handling',
    description: 'Live coding: build a transform stream pipeline with proper backpressure signaling for large CSV exports.',
    candidateEmail: 'jordan.lee@backend.io',
    status: 'ACTIVE',
    scheduledTime: new Date().toISOString(),
    codeContent: 'const { Transform } = require(\'stream\');',
    language: 'javascript',
    transcript: [],
  },
  {
    id: 'demo_algo_graphs',
    title: 'Graph Algorithms — Shortest Path',
    description: 'Dijkstra vs A* tradeoffs, then implement a BFS-based shortest path on a weighted adjacency list.',
    candidateEmail: 'maya.okonkwo@algos.dev',
    status: 'SCHEDULED',
    scheduledTime: new Date(Date.now() + 1 * 86_400_000).toISOString(),
    codeContent: '// Collaborative workspace initialized\n',
    language: 'python',
    transcript: [],
  },
  {
    id: 'demo_db_query_opt',
    title: 'PostgreSQL Query Optimization Sprint',
    description: 'Analyze slow query logs, rewrite using CTEs, partial indexes, and EXPLAIN ANALYZE profiling.',
    candidateEmail: 'sam.rivera@dbcraft.io',
    status: 'SCHEDULED',
    scheduledTime: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    codeContent: '-- Initial query stub\nSELECT * FROM user_events WHERE created_at > NOW() - INTERVAL \'30 days\';',
    language: 'sql',
    transcript: [],
  },
  {
    id: 'demo_ml_infra',
    title: 'ML Inference Infrastructure Design',
    description: 'Reviewing model serving pipeline: batching, ONNX runtime, GPU utilization, and latency SLAs.',
    candidateEmail: 'nina.volkov@mlops.ai',
    status: 'SCHEDULED',
    scheduledTime: new Date(Date.now() + 6 * 86_400_000).toISOString(),
    codeContent: '# ML Inference stub\nimport onnxruntime as ort\n',
    language: 'python',
    transcript: [],
  },
];

export function useDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useInterviewStore();

  const [interviews, setInterviews] = useState<InterviewDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [dashboardView, setDashboardView] = useState<'list' | 'calendar'>('list');
  const [calendarDate, setCalendarDate] = useState(() => new Date());

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'>('WEEKLY');
  const [recurrenceEndOccurrences, setRecurrenceEndOccurrences] = useState(12);

  const [selectedReview, setSelectedReview] = useState<InterviewDetails | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((iv) => {
      const matchesStatus = statusFilter === 'ALL' || iv.status === statusFilter;
      const q = debouncedSearchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        iv.title.toLowerCase().includes(q) ||
        (iv.description ?? '').toLowerCase().includes(q) ||
        (iv.candidateEmail ?? '').toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [interviews, debouncedSearchQuery, statusFilter]);

  const interviewerStats = useMemo(() => {
    const total = interviews.length;
    const active = interviews.filter((i) => i.status === 'ACTIVE').length;
    const completed = interviews.filter((i) => i.status === 'COMPLETED');
    const scheduled = interviews.filter((i) => i.status === 'SCHEDULED').length;
    const withFeedback = completed.filter((i) => i.feedback?.technicalRating !== undefined);
    const avgTechnical =
      withFeedback.length > 0
        ? withFeedback.reduce((acc, i) => acc + (i.feedback?.technicalRating ?? 0), 0) / withFeedback.length
        : 0;
    const passed = completed.filter((i) => (i.feedback?.score ?? 0) >= 70).length;
    const successRate = completed.length > 0 ? Number(((passed / completed.length) * 100).toFixed(1)) : 0;
    const withScore = completed.filter((i) => i.feedback?.score !== undefined);
    const avgScore = withScore.length > 0
      ? Math.round(withScore.reduce((acc, i) => acc + (i.feedback?.score ?? 0), 0) / withScore.length)
      : 0;
    return { total, active, completed: completed.length, scheduled, avgTechnical, successRate, withFeedback: withFeedback.length, avgScore };
  }, [interviews]);

  const interviewCounts = useMemo(() => ({
    ALL: interviews.length,
    ACTIVE: interviews.filter(i => i.status === 'ACTIVE').length,
    SCHEDULED: interviews.filter(i => i.status === 'SCHEDULED').length,
    COMPLETED: interviews.filter(i => i.status === 'COMPLETED').length,
  }), [interviews]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const tid = searchParams.get('template');
    if (!tid) return;
    fetchTemplate(tid)
      .then((t) => {
        setTitle(t.title);
        setDescription(t.description ?? '');
        setTemplateId(t.id);
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (mounted && !user) router.push('/auth/login');
  }, [mounted, user, router]);

  const isGuestUser = isGuest(user);

  useEffect(() => {
    if (!user || isGuestUser) return;
    if (typeof window !== 'undefined') {
      const onboardingDone = localStorage.getItem('onboarding_complete');
      const tourDone = localStorage.getItem('tour_complete');
      if (!onboardingDone) {
        const t = setTimeout(() => setShowOnboarding(true), 600);
        return () => clearTimeout(t);
      }
      if (!tourDone) {
        const t = setTimeout(() => setShowTour(true), 800);
        return () => clearTimeout(t);
      }
    }
  }, [user]);

  const fetchInterviews = useCallback(async () => {
    if (isGuestUser) {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 600));
      setInterviews(DEMO_INTERVIEWS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await authFetch(`${API_URL}/interviews`, {});
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch interviews');
      setInterviews(data);
    } catch {
      setInterviews([]);
      toast.error('Failed to load', 'Could not fetch interviews from server.');
    } finally {
      setLoading(false);
    }
  }, [isGuestUser]);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  const loadDemoData = useCallback(async () => {
    setDemoLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    setInterviews(DEMO_INTERVIEWS);
    setDemoLoading(false);
    toast.success('Demo data loaded', '6 rich interview sessions added — explore the full dashboard experience.');
  }, []);

  const handleCopyLink = useCallback((e: React.MouseEvent, interviewId: string) => {
    e.stopPropagation();
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const iv = interviews.find((i) => i.id === interviewId);
    const tokenQuery = iv && iv.candidateToken ? `?token=${iv.candidateToken}` : '';
    const url = `${origin}/interview/${interviewId}${tokenQuery}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(interviewId);
      toast.success('Invite link copied', tokenQuery ? 'Seamless candidate auto-login link copied.' : `Room URL ready to share: /interview/${interviewId}`);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      toast.error('Copy failed', 'Unable to access clipboard. Please copy the URL manually.');
    });
  }, [interviews]);

  const handleOnboardingComplete = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('onboarding_complete', 'true');
    setShowOnboarding(false);
    setTimeout(() => setShowTour(true), 500);
  }, []);

  const handleTourComplete = useCallback(() => {
    if (typeof window !== 'undefined') localStorage.setItem('tour_complete', 'true');
    setShowTour(false);
  }, []);

  const handleSchedule = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ivTitle = title;
    const prevInterviews = interviews;

    const optimisticId = `opt-${Date.now()}`;
    setInterviews((prev) => [{
      id: optimisticId, title, description, candidateEmail,
      status: 'SCHEDULED' as const,
      scheduledTime: new Date(scheduledTime).toISOString(),
      codeContent: '', language: 'javascript', transcript: [],
    }, ...prev]);

    const body: Record<string, unknown> = { title, description, scheduledTime, candidateEmail, templateId };
    if (recurrenceEnabled) {
      body.recurrence = {
        frequency: recurrenceFrequency,
        occurrences: recurrenceEndOccurrences,
      };
    }

    try {
      const response = await authFetch(`${API_URL}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const created = await response.json();
      if (!response.ok) throw new Error(created.message || 'Failed to schedule');

      setInterviews((prev) =>
        prev.map((i) => (i.id === optimisticId ? { ...created } : i)),
      );
      setTitle(''); setDescription(''); setScheduledTime(''); setCandidateEmail(''); setTemplateId(null);
      setRecurrenceEnabled(false); setRecurrenceFrequency('WEEKLY'); setRecurrenceEndOccurrences(12);

      useActionHistory.getState().pushAction({
        type: 'interview:created',
        label: 'Interview scheduled',
        description: `"${ivTitle}" has been added.`,
        undo: async () => {
          const res = await authFetch(`${API_URL}/interviews/${created.id}`, {
            method: 'DELETE',
          });
          if (!res.ok) throw new Error('Undo failed');
          setInterviews((prev) => prev.filter((i) => i.id !== created.id));
        },
      });
    } catch (err) {
      setInterviews(prevInterviews);
      const msg = err instanceof Error ? err.message : 'Could not create interview.';
      toast.error('Schedule failed', msg);
    } finally {
      setSubmitting(false);
    }
  }, [title, description, scheduledTime, candidateEmail, templateId, interviews, recurrenceEnabled, recurrenceFrequency, recurrenceEndOccurrences]);

  const handleStartRoom = useCallback((id: string) => {
    router.push(`/interview/${id}`);
  }, [router]);

  const handleCancelInterview = useCallback(async (id: string, currentStatus: string) => {
    const iv = interviews.find((i) => i.id === id);
    if (!iv || iv.status === 'CANCELLED') return;
    const prevInterviews = interviews;

    setInterviews((prev) =>
      prev.map((i) => (i.id === id ? { ...i, status: 'CANCELLED' as const } : i)),
    );

    try {
      const response = await authFetch(`${API_URL}/interviews/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (!response.ok) throw new Error('Failed to cancel');

      useActionHistory.getState().pushAction({
        type: 'interview:cancelled',
        label: 'Interview cancelled',
        description: `"${iv.title}" has been cancelled.`,
        undo: async () => {
          const res = await authFetch(`${API_URL}/interviews/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: currentStatus }),
          });
          if (!res.ok) throw new Error('Undo failed');
          setInterviews((prev) =>
            prev.map((i) => (i.id === id ? { ...i, status: currentStatus as InterviewDetails['status'] } : i)),
          );
        },
      });
    } catch {
      setInterviews(prevInterviews);
      toast.error('Cancel failed', 'Could not cancel the interview.');
    }
  }, [interviews]);

  const handleDeleteInterview = useCallback(async (id: string) => {
    const iv = interviews.find((i) => i.id === id);
    if (!iv) return;
    const prevInterviews = interviews;

    setInterviews((prev) => prev.filter((i) => i.id !== id));

    try {
      const response = await authFetch(`${API_URL}/interviews/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');

      useActionHistory.getState().pushAction({
        type: 'interview:deleted',
        label: 'Interview deleted',
        description: `"${iv.title}" has been removed.`,
        undo: async () => {
          toast.error('Restore unavailable', 'Deleted interviews cannot be restored from the client.');
        },
      });
    } catch {
      setInterviews(prevInterviews);
      toast.error('Delete failed', 'Could not delete the interview.');
    }
  }, [interviews]);

  const selectReviewSession = useCallback((interview: InterviewDetails) => {
    if (interview.status === 'COMPLETED') setSelectedReview(interview);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('ALL');
  }, []);

  // ── Command Palette action dispatcher ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      switch (action) {
        case 'schedule-interview': {
          const el = document.getElementById('schedule-form');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          break;
        }
        case 'toggle-view':
          setDashboardView((p) => (p === 'list' ? 'calendar' : 'list'));
          break;
        case 'refresh-interviews':
          fetchInterviews();
          break;
        case 'about-interviewos':
          toast.info(
            'InterviewOS v1.0.0',
            'AI Realtime Interview Platform — Realtime WebRTC signaling, collaborative coding, Whisper transcription, and AI-driven feedback.',
          );
          break;
      }
    };
    window.addEventListener('cmdk:action', handler);
    return () => window.removeEventListener('cmdk:action', handler);
  }, [fetchInterviews]);

  return {
    user,
    mounted,
    interviews, setInterviews,
    loading,
    dashboardView,
    setDashboardView,
    calendarDate,
    setCalendarDate,
    title, setTitle,
    description, setDescription,
    scheduledTime, setScheduledTime,
    candidateEmail, setCandidateEmail,
    submitting,
    templateId,
    clearTemplate: () => { setTemplateId(null); setTitle(''); setDescription(''); },
    recurrenceEnabled, setRecurrenceEnabled,
    recurrenceFrequency, setRecurrenceFrequency,
    recurrenceEndOccurrences, setRecurrenceEndOccurrences,
    selectedReview, setSelectedReview,
    showOnboarding,
    showTour,
    copiedId,
    demoLoading,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    filteredInterviews,
    interviewerStats,
    interviewCounts,
    fetchInterviews,
    loadDemoData,
    handleCopyLink,
    handleOnboardingComplete,
    handleSchedule,
    handleStartRoom,
    handleCancelInterview,
    handleDeleteInterview,
    selectReviewSession,
    handleClearFilters,
    handleTourComplete,
  };
}
