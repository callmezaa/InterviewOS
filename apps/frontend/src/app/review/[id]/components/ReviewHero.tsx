'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { triggerScoreConfetti } from '../../../../lib/confetti';
import type { InterviewDetails } from '../../../../store/useInterviewStore';

interface ReviewHeroProps {
  interview: InterviewDetails;
}

function formatDuration(iso1: string, iso2: string): string {
  const diff = Math.abs(new Date(iso2).getTime() - new Date(iso1).getTime());
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

export function ReviewHero({ interview }: ReviewHeroProps) {
  const feedback = interview.feedback;
  const scheduledDate = new Date(interview.scheduledTime);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (feedback && feedback.score >= 80 && !confettiFired.current) {
      confettiFired.current = true;
      const timer = setTimeout(() => triggerScoreConfetti(), 600);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const scoreColor = feedback
    ? feedback.score >= 80 ? 'text-emerald-400' : feedback.score >= 60 ? 'text-amber-400' : 'text-red-400'
    : 'text-white/50';

  return (
    <div className="bg-gradient-to-b from-white/[0.02] to-transparent border border-white/[0.06] rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-6">
      {/* Score ring */}
      {feedback ? (
        <div className="relative shrink-0">
          <svg width="96" height="96" className="rotate-[-90deg]">
            <circle cx="48" cy="48" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
            <motion.circle
              cx="48" cy="48" r="42" fill="none"
              style={{ stroke: feedback.score >= 80 ? 'var(--color-success-soft)' : feedback.score >= 60 ? 'var(--color-warning)' : 'var(--color-danger-soft)' }}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - feedback.score / 100) }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className={`text-[28px] font-bold font-display tracking-tight ${scoreColor}`}
            >
              {feedback.score}
            </motion.span>
          </div>
        </div>
      ) : (
        <div className="w-[96px] h-[96px] rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center">
          <Award className="w-8 h-8 text-white/20" />
        </div>
      )}

      {/* Title + Status + Ratings */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="font-display font-semibold text-h1 text-white truncate">
              {interview.title}
            </h1>
            <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-pill bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold font-mono">
              <CheckCircle2 className="w-3 h-3" />
              <span>Completed</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-body-muted/50">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {feedback && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-body-muted/55 font-mono">Technical</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-2 h-2 rounded-full ${
                      star <= Math.round(feedback.technicalRating)
                        ? 'bg-primary'
                        : 'bg-white/[0.06]'
                    }`}
                  />
                ))}
                <span className="text-[13px] font-semibold text-white ml-1">{feedback.technicalRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="w-px h-4 bg-white/[0.06]" />
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-body-muted/55 font-mono">Communication</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={`w-2 h-2 rounded-full ${
                      star <= Math.round(feedback.communicationRating)
                        ? 'bg-primary'
                        : 'bg-white/[0.06]'
                    }`}
                  />
                ))}
                <span className="text-[13px] font-semibold text-white ml-1">{feedback.communicationRating.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
