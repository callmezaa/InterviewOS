'use client';

import React, { Suspense, useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, LayoutPanelLeft, Sparkles, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../../components/ui/Header';
import { useInterviewStore } from '../../store/useInterviewStore';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { DashboardSkeleton } from '../../components/dashboard/DashboardSkeleton';
import { OnboardingModal } from '../../components/ui/OnboardingModal';
import { CandidatePortal } from '../../components/ui/CandidatePortal';
import { DashboardMetrics } from '../../components/dashboard/DashboardMetrics';
import { SearchToolbar } from '../../components/dashboard/SearchToolbar';
import { InterviewList } from '../../components/dashboard/InterviewList';
import { CalendarView } from '../../components/dashboard/CalendarView';
import { AIFeedbackPanel } from '../../components/dashboard/AIFeedbackPanel';
import { AIInsightsWidget } from '../../components/dashboard/AIInsightsWidget';
import { ScheduleForm } from '../../components/dashboard/ScheduleForm';
import { ActivityFeed } from '../../components/dashboard/ActivityFeed';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { SignUpPrompt } from '../../components/ui/SignUpPrompt';
import { useDashboard } from '../../hooks/useDashboard';

import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { GuidedTour, INTERVIEWER_TOUR, CANDIDATE_TOUR } from '../../components/ui/GuidedTour';
import { useShortcuts } from '../../hooks/useShortcuts';
import { api } from '../../lib/api';
import { toast } from '../../store/useToastStore';
import { useActionHistory } from '../../store/useActionHistoryStore';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}

function Dashboard() {
  const {
    user, mounted, loading,
    dashboardView, setDashboardView,
    calendarDate, setCalendarDate,
    title, setTitle,
    description, setDescription,
    scheduledTime, setScheduledTime,
    candidateEmail, setCandidateEmail,
    submitting,
    selectedReview, setSelectedReview,
    showOnboarding, showTour,
    handleTourComplete,
    copiedId,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    interviews,
    filteredInterviews,
    interviewerStats,
    interviewCounts,
    fetchInterviews,
    handleCopyLink,
    handleOnboardingComplete,
    handleSchedule,
    handleStartRoom,
    selectReviewSession,
    handleClearFilters,
    setInterviews,
    recurrenceEnabled, setRecurrenceEnabled,
    recurrenceFrequency, setRecurrenceFrequency,
    recurrenceEndOccurrences, setRecurrenceEndOccurrences,
  } = useDashboard();

  const router = useRouter();
  const dashboardMode = useInterviewStore((s) => s.dashboardMode);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'cancel'; ids: string[] } | null>(null);
  const [showSignUpPrompt, setShowSignUpPrompt] = useState(false);
  const [signUpFeature, setSignUpFeature] = useState('');

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(filteredInterviews.map((i) => i.id));
  }, [filteredInterviews]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return;
    setConfirmAction({ type: 'delete', ids: [...selectedIds] });
  }, [selectedIds]);

  const handleBulkCancel = useCallback(() => {
    if (selectedIds.length === 0) return;
    setConfirmAction({ type: 'cancel', ids: [...selectedIds] });
  }, [selectedIds]);

  const confirmBulkDelete = useCallback(async () => {
    if (!confirmAction) return;
    const ids = confirmAction.ids;
    setConfirmAction(null);
    const titles = ids.map((id) => interviews.find((i) => i.id === id)?.title ?? id);
    const prevInterviews = interviews;

    setInterviews((prev) => prev.filter((i) => !ids.includes(i.id)));
    setSelectedIds([]);

    try {
      const results = await Promise.allSettled(
        ids.map((id) => api.del(`/interviews/${id}`)),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      if (failed > 0) {
        setInterviews(prevInterviews);
        toast.warning(`Deleted ${ids.length - failed} of ${ids.length}`, `${failed} could not be deleted.`);
        return;
      }
      useActionHistory.getState().pushAction({
        type: 'interviews:bulk-deleted',
        label: `${ids.length} interview${ids.length > 1 ? 's' : ''} deleted`,
        description: `"${titles[0]}"${titles.length > 1 ? ` and ${titles.length - 1} other${titles.length > 2 ? 's' : ''}` : ''} removed.`,
        undo: async () => {
          toast.error('Bulk restore unavailable', 'Deleted interviews cannot be restored from the client.');
        },
      });
    } catch {
      setInterviews(prevInterviews);
      toast.error('Bulk delete failed', 'An unexpected error occurred.');
    }
  }, [confirmAction, interviews]);

  const confirmBulkCancel = useCallback(async () => {
    if (!confirmAction) return;
    const ids = confirmAction.ids;
    setConfirmAction(null);
    const prevInterviews = interviews;
    const scheduled = ids.filter((id) => interviews.find((i) => i.id === id)?.status === 'SCHEDULED');

    setInterviews((prev) =>
      prev.map((i) =>
        ids.includes(i.id) && i.status === 'SCHEDULED' ? { ...i, status: 'CANCELLED' as const } : i,
      ),
    );
    setSelectedIds([]);

    try {
      const results = await Promise.allSettled(
        scheduled.map((id) =>
          api.put(`/interviews/${id}/status`, { status: 'CANCELLED' }),
        ),
      );
      const failed = results.filter((r) => r.status === 'rejected').length;
      const cancelled = scheduled.length - failed;
      if (failed > 0) {
        setInterviews(prevInterviews);
        toast.warning(`${cancelled} cancelled, ${failed} failed`);
      } else if (cancelled > 0) {
        useActionHistory.getState().pushAction({
          type: 'interviews:bulk-cancelled',
          label: `${cancelled} session${cancelled > 1 ? 's' : ''} cancelled`,
          description: `${cancelled} scheduled session${cancelled > 1 ? 's' : ''} cancelled.`,
          undo: async () => {
            const results = await Promise.allSettled(
              scheduled.map((id) =>
                api.put(`/interviews/${id}/status`, { status: 'SCHEDULED' }),
              ),
            );
            const failed = results.filter((r) => r.status === 'rejected').length;
            if (failed > 0) throw new Error(`${failed} could not be restored`);
            setInterviews((prev) =>
              prev.map((i) =>
                scheduled.includes(i.id) ? { ...i, status: 'SCHEDULED' as const } : i,
              ),
            );
          },
        });
      }
    } catch {
      setInterviews(prevInterviews);
      toast.error('Bulk cancel failed', 'An unexpected error occurred.');
    }
  }, [confirmAction, interviews]);

  const handleScheduleWrapper = useCallback((e: React.FormEvent) => {
    handleSchedule(e);
  }, [handleSchedule]);

  const handleBulkCopyLinks = useCallback(async () => {
    if (selectedIds.length === 0) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const lines = selectedIds.map((id) => {
      const iv = interviews.find((i) => i.id === id);
      const tokenQuery = iv?.candidateToken ? `?token=${iv.candidateToken}` : '';
      return `${origin}/interview/${id}${tokenQuery}`;
    });
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      toast.success(`${lines.length} link${lines.length > 1 ? 's' : ''} copied`, `Ready to share.`);
    } catch {
      toast.error('Copy failed', 'Unable to access clipboard.');
    }
  }, [selectedIds, interviews]);

  const handleBulkExportCSV = useCallback(() => {
    if (selectedIds.length === 0) return;
    const selected = interviews.filter((i) => selectedIds.includes(i.id));
    const headers = ['Title', 'Status', 'Date', 'Candidate Email', 'Score', 'Technical', 'Communication'];
    const rows = selected.map((i) => [
      `"${i.title}"`,
      i.status,
      new Date(i.scheduledTime).toISOString(),
      i.candidateEmail ?? '',
      i.feedback?.score ?? '',
      i.feedback?.technicalRating ?? '',
      i.feedback?.communicationRating ?? '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InterviewOS_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${selected.length} session${selected.length > 1 ? 's' : ''} exported`, 'CSV file downloaded.');
  }, [selectedIds, interviews]);

  const handleReschedule = useCallback(async (interviewId: string, newDate: Date, originalDate: Date) => {
    const origISO = originalDate.toISOString();
    const newISO = newDate.toISOString();
    const prevInterviews = interviews;
    const ivTitle = interviews.find((i) => i.id === interviewId)?.title ?? 'Session';

    setInterviews((prev) =>
      prev.map((i) => (i.id === interviewId ? { ...i, scheduledTime: newISO } : i)),
    );

    try {
      await api.patch(`/interviews/${interviewId}/reschedule`, { scheduledTime: newISO });
      useActionHistory.getState().pushAction({
        type: 'interview:rescheduled',
        label: 'Session rescheduled',
        description: `"${ivTitle}" moved to ${newDate.toLocaleDateString()} at ${newDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        undo: async () => {
          await api.patch(`/interviews/${interviewId}/reschedule`, { scheduledTime: origISO });
          setInterviews((prev) =>
            prev.map((i) => (i.id === interviewId ? { ...i, scheduledTime: origISO } : i)),
          );
        },
      });
    } catch {
      setInterviews(prevInterviews);
      toast.error('Failed to reschedule', 'Please try again');
    }
  }, [interviews]);

  useShortcuts([
    {
      def: { id: 'dash-new', key: 'n', label: 'N', description: '', category: '', scope: 'dashboard', isInputProtected: true },
      handler: () => {
        const el = document.getElementById('schedule-form');
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => { const inp = el?.querySelector('input,textarea'); if (inp instanceof HTMLElement) inp.focus(); }, 300);
      },
    },
    {
      def: { id: 'dash-search', key: '/', label: '/', description: '', category: '', scope: 'dashboard', isInputProtected: true },
      handler: () => {
        const el = document.querySelector('[data-search-input]') as HTMLInputElement | null;
        el?.focus();
      },
    },
    {
      def: { id: 'dash-refresh', key: 'r', label: 'R', description: '', category: '', scope: 'dashboard', isInputProtected: true },
      handler: () => fetchInterviews(),
    },
    {
      def: { id: 'dash-toggle-view', key: 'v', label: 'V', description: '', category: '', scope: 'dashboard', isInputProtected: true },
      handler: () => setDashboardView((p) => (p === 'list' ? 'calendar' : 'list')),
    },
    { def: { id: 'dash-filter-all', key: '1', label: '1', description: '', category: '', scope: 'dashboard', isInputProtected: true }, handler: () => setStatusFilter('ALL') },
    { def: { id: 'dash-filter-active', key: '2', label: '2', description: '', category: '', scope: 'dashboard', isInputProtected: true }, handler: () => setStatusFilter('ACTIVE') },
    { def: { id: 'dash-filter-scheduled', key: '3', label: '3', description: '', category: '', scope: 'dashboard', isInputProtected: true }, handler: () => setStatusFilter('SCHEDULED') },
    { def: { id: 'dash-filter-completed', key: '4', label: '4', description: '', category: '', scope: 'dashboard', isInputProtected: true }, handler: () => setStatusFilter('COMPLETED') },
    { def: { id: 'dash-deselect', key: 'Escape', label: 'Esc', description: '', category: '', scope: 'dashboard', isInputProtected: true }, handler: () => setSelectedIds([]) },
    { def: { id: 'dash-delete-selected', key: 'Delete', label: 'Del', description: '', category: '', scope: 'dashboard', isInputProtected: true }, handler: () => { if (selectedIds.length > 0) handleBulkDelete(); } },
  ], mounted && !!user);

  if (!mounted) {
    return <DashboardSkeleton />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans selection:bg-primary">
      <Header />

      <main id="main-content" className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-12 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <p className="text-[13px] text-body-muted/55 font-mono shrink-0">
                {getGreeting()}, <span className="text-primary-on-dark/70">{user.name?.split(' ')[0] ?? 'there'}</span>
                <span className="text-body-muted/25 mx-2">·</span>
                <span>{interviews.length} {interviews.length === 1 ? 'session' : 'sessions'}</span>
              </p>

              <div className="relative flex-1 max-w-[260px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-body-muted/50 pointer-events-none" />
                <input
                  type="text"
                  data-search-input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sessions..."
                  className="w-full bg-white/[0.02] border border-white/[0.06] focus:border-white/[0.12] focus:bg-white/[0.03] focus:outline-none focus:ring-1 focus:ring-white/[0.08] rounded-lg pl-9 pr-3 py-1.5 text-[12px] transition-all duration-300 placeholder:text-body-muted/25"
                  aria-label="Search interview sessions"
                />
              </div>
            </div>

            {dashboardMode === 'INTERVIEWER' && !loading && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[11px] font-mono font-semibold text-body-muted/60">AI Readiness</span>
                  <span className="text-[18px] font-bold font-display text-white leading-none">
                    {interviewerStats.withFeedback > 0 ? interviewerStats.avgScore : '—'}
                    {interviewerStats.withFeedback > 0 && <span className="text-[11px] text-white/50">%</span>}
                  </span>
                </div>
              </div>
            )}
          </motion.div>

          {dashboardMode === 'INTERVIEWER' && !loading && (
            <ErrorBoundary name="DashboardMetrics">
              <DashboardMetrics stats={interviewerStats} />
            </ErrorBoundary>
          )}

          <ErrorBoundary name="AIInsightsWidget">
            <AIInsightsWidget
              interviews={interviews}
              onViewLatestReview={(iv) => setSelectedReview(iv)}
            />
          </ErrorBoundary>

          <SearchToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            dashboardView={dashboardView}
            onViewChange={setDashboardView}
            onRefresh={fetchInterviews}
            interviewCounts={interviewCounts}
          />

          {/* Next upcoming interview */}
          {dashboardMode === 'INTERVIEWER' && !loading && interviews.length > 0 && (() => {
            const upcoming = [...interviews]
              .filter(i => i.status === 'SCHEDULED')
              .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())[0];
            if (!upcoming) return null;
            return (
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="w-1.5 h-1.5 rounded-full bg-primary-on-dark shrink-0" />
                <span className="text-[12px] text-white/70 font-medium">Up next:</span>
                <span className="text-[13px] text-white font-medium">{upcoming.title}</span>
                <span className="text-[11px] text-body-muted/50 font-mono">
                  {new Date(upcoming.scheduledTime).toLocaleDateString()} @ {new Date(upcoming.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })()}

          {/* FAB — Schedule New */}
          {dashboardMode === 'INTERVIEWER' && !loading && interviews.length > 0 && (
            <button
              onClick={() => {
                const form = document.getElementById('schedule-form');
                form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-white text-[13px] font-semibold hover:bg-primary-focus transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Schedule new interview"
            >
              <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Schedule New
            </button>
          )}

          {loading ? (
            <SkeletonCard count={3} />
          ) : (
            <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
              {dashboardView === 'list' ? (
                <motion.div
                  key="list-view"
                  data-tour="interview-list"
                  className="h-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <InterviewList
                    loading={false}
                    interviews={interviews}
                    filteredInterviews={filteredInterviews}
                    searchQuery={searchQuery}
                    statusFilter={statusFilter}
                    userRole={dashboardMode}
                    onCopyLink={handleCopyLink}
                    onStartRoom={handleStartRoom}
                    onSelectReview={selectReviewSession}
                    copiedId={copiedId}
                    onClearFilters={handleClearFilters}
                    onSchedule={() => {
                      const form = document.getElementById('schedule-form');
                      form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    selectedIds={selectedIds}
                    onToggleSelect={handleToggleSelect}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    onBulkDelete={handleBulkDelete}
                    onBulkCancel={handleBulkCancel}
                    onBulkCopyLinks={handleBulkCopyLinks}
                    onBulkExportCSV={handleBulkExportCSV}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="calendar-view"
                  className="h-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ErrorBoundary name="CalendarView">
                    <CalendarView
                      interviews={filteredInterviews}
                      calendarDate={calendarDate}
                      onPrevMonth={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                      onNextMonth={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                      onSelectInterview={selectReviewSession}
                      onReschedule={handleReschedule}
                    />
                  </ErrorBoundary>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[440px] flex flex-col gap-4 sm:gap-6">
          {/* Mobile toggle button — hidden on lg+ */}
          <button
            onClick={() => setSidebarOpen((p) => !p)}
            className="flex lg:hidden items-center gap-2 w-full px-4 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-white/60 hover:text-white/80 hover:bg-white/[0.04] transition-colors text-[13px] font-medium"
          >
            <LayoutPanelLeft className="w-4 h-4" />
            <span className="flex-1 text-left">Tools &amp; Insights</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                sidebarOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence initial={false}>
          <motion.div
            key="sidebar-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className={`flex flex-col gap-4 sm:gap-6 overflow-hidden lg:!overflow-visible ${
              sidebarOpen ? '' : 'hidden lg:flex'
            }`}
          >
          {selectedReview ? (
            <ErrorBoundary name="AIFeedbackPanel">
              <AIFeedbackPanel interview={selectedReview} onClose={() => setSelectedReview(null)} />
            </ErrorBoundary>
          ) : dashboardMode === 'INTERVIEWER' ? (
            <div data-tour="schedule-form">
              <ScheduleForm
                title={title}
                onTitleChange={setTitle}
                description={description}
                onDescriptionChange={setDescription}
                candidateEmail={candidateEmail}
                onCandidateEmailChange={setCandidateEmail}
                scheduledTime={scheduledTime}
                onScheduledTimeChange={setScheduledTime}
                submitting={submitting}
                onSubmit={handleScheduleWrapper}
                recurrenceEnabled={recurrenceEnabled}
                onRecurrenceToggle={setRecurrenceEnabled}
                recurrenceFrequency={recurrenceFrequency}
                onRecurrenceFrequencyChange={setRecurrenceFrequency}
                recurrenceEndOccurrences={recurrenceEndOccurrences}
                onRecurrenceEndOccurrencesChange={setRecurrenceEndOccurrences}
              />
            </div>
          ) : (
            <ErrorBoundary name="CandidatePortal">
              <CandidatePortal
                interviews={filteredInterviews}
                onJoin={handleStartRoom}
              />
            </ErrorBoundary>
          )}
          <ErrorBoundary name="ActivityFeed">
            <div data-tour="activity-feed">
              <ActivityFeed interviews={interviews} />
            </div>
          </ErrorBoundary>
          </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showOnboarding && user && (
          <OnboardingModal
            userName={user.name}
            userRole={dashboardMode}
            onComplete={handleOnboardingComplete}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTour && user && (
          <GuidedTour
            steps={dashboardMode === 'INTERVIEWER' ? INTERVIEWER_TOUR : CANDIDATE_TOUR}
            onComplete={handleTourComplete}
            onSkip={handleTourComplete}
            role={dashboardMode}
          />
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={confirmAction?.type === 'delete'}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmBulkDelete}
        title={`Delete ${confirmAction?.ids.length ?? 0} session${(confirmAction?.ids.length ?? 0) > 1 ? 's' : ''}?`}
        description={`This action cannot be undone. ${(confirmAction?.ids.length ?? 0) > 1 ? 'All selected interviews will be permanently removed.' : 'The selected interview will be permanently removed.'}`}
        confirmText="Delete"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={confirmAction?.type === 'cancel'}
        onClose={() => setConfirmAction(null)}
        onConfirm={confirmBulkCancel}
        title={`Cancel ${confirmAction?.ids.length ?? 0} session${(confirmAction?.ids.length ?? 0) > 1 ? 's' : ''}?`}
        description="Only scheduled interviews will be affected. Active or completed sessions will be skipped."
        confirmText="Cancel Sessions"
        variant="warning"
      />

      <SignUpPrompt
        isOpen={showSignUpPrompt}
        onClose={() => setShowSignUpPrompt(false)}
        title="Create your free account"
        description="Sign up to save your interviews, invite your team, and unlock AI-powered feedback."
        feature={signUpFeature}
      />
    </div>
  );
}
