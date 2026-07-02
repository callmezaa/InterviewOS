'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Terminal, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { ReviewHero } from './components/ReviewHero';
import { TranscriptPanel } from './components/TranscriptPanel';
import { AIFeedbackSection } from './components/AIFeedbackSection';
import { CodeReviewPanel } from './components/CodeReviewPanel';
import { RecordingPlayer } from '../../../components/ui/RecordingPlayer';
import { PDFExport } from '../../../components/ui/PDFExport';
import { ShareReviewLink } from '../../../components/ui/ShareReviewLink';
import { ReviewSkeleton } from '../../../components/ui/ReviewSkeleton';
import { IlustrationError } from '../../../components/ui/Illustrations';
import { useBranding } from '../../../components/providers/BrandingProvider';
import type { InterviewDetails } from '../../../store/useInterviewStore';
import { API_URL } from '../../../lib/config';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const ease = [0.22, 1, 0.36, 1] as const;

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewId = params.id as string;
  const shareToken = searchParams.get('token');
  const branding = useBranding();

  const [interview, setInterview] = useState<InterviewDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const url = shareToken
          ? `${API_URL}/shared/review/${interviewId}/${shareToken}`
          : `${API_URL}/interviews/${interviewId}`;
        const res = await fetch(url, {
          credentials: 'include',
        });
        if (!res.ok) throw new Error(res.status === 404 ? 'Interview not found' : res.status === 403 ? 'Invalid or expired share link' : 'Failed to load interview');
        const data = await res.json();
        setInterview(data);
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [interviewId, shareToken]);

  if (loading) {
    return <ReviewSkeleton />;
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-surface-black text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="w-[100px] h-[75px] text-red-400/20 mb-4">
          <IlustrationError className="w-full h-full" />
        </div>
        <h1 className="font-display font-semibold text-h1 text-white/90 mb-1">
          Review unavailable
        </h1>
        <p className="text-body-muted/50 text-[14px] mb-6 max-w-[340px] text-center">{error || 'Interview not found'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-pill text-[14px] hover:bg-primary-focus transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to dashboard</span>
        </Link>
      </div>
    );
  }

  const feedback = interview.feedback;
  const recordingUrl = interview.recordingUrl;

  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans selection:bg-primary">
      <header className="w-full h-11 bg-surface-black border-b border-white/[0.06] flex items-center justify-between px-4 md:px-12">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <ArrowLeft className="w-4 h-4 text-body-muted/55 group-hover:text-white transition-colors" />
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.name} className="w-4 h-4 object-contain" />
          ) : (
            <Terminal className="w-4 h-4" style={{ color: branding.primaryColor }} />
          )}
          <span className="font-display font-semibold text-[14px] tracking-tight text-white">{branding.name}</span>
        </Link>
        <span className="text-[11px] text-body-muted/50 font-mono">Review</span>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-12 flex flex-col gap-8"
      >
        {/* Breadcrumb */}
        <motion.div variants={sectionVariants} className="flex items-center gap-2 text-[12px] text-body-muted/55">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-white/60">{interview.title}</span>
        </motion.div>

        {/* Hero — Score + Stats */}
        <motion.div variants={sectionVariants}>
          <ReviewHero interview={interview} />
        </motion.div>

        {/* Session Recording */}
        {recordingUrl && (
          <motion.div variants={sectionVariants}>
            <RecordingPlayer
              recordingUrl={recordingUrl}
              title={`${interview.title} — ${new Date(interview.scheduledTime).toLocaleDateString()}`}
            />
          </motion.div>
        )}

        {/* Two-column layout for feedback + transcript */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: AI Feedback */}
          <motion.div variants={sectionVariants} className="lg:col-span-2 flex flex-col gap-6">
            {feedback ? (
              <AIFeedbackSection feedback={feedback} />
            ) : (
              <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-8 text-center text-body-muted/55 text-[13px]">
                No AI feedback was generated for this session.
              </div>
            )}
          </motion.div>

          {/* Right: Transcript Panel */}
          <motion.div variants={sectionVariants} className="flex flex-col gap-6">
            <TranscriptPanel transcript={interview.transcript} />
          </motion.div>
        </div>

        {/* Code Replay */}
        {interview.codeHistory && interview.codeHistory.length > 0 && (
          <motion.div variants={sectionVariants}>
            <CodeReviewPanel interview={interview} />
          </motion.div>
        )}

        {/* Footer actions */}
        <motion.div variants={sectionVariants} className="flex items-center justify-between gap-4 pt-4 border-t border-white/[0.06] pb-8">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 text-body-muted/60 hover:text-white text-[14px] transition-colors border border-white/[0.06] hover:border-white/[0.12] rounded-pill"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <PDFExport interview={interview} />
            {!shareToken && <ShareReviewLink interviewId={interview.id} />}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-body-muted/50 font-mono">
            <Terminal className="w-3 h-3" />
            <span>Session ID: {interview.id.slice(0, 8)}</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
