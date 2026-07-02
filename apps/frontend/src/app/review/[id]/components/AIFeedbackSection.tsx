'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Award, BarChart3, MessageSquareText, FileText } from 'lucide-react';

interface AIFeedbackSectionProps {
  feedback: {
    score: number;
    technicalRating: number;
    communicationRating: number;
    summary: string;
    detailedReview: string;
  };
}

export function AIFeedbackSection({ feedback }: AIFeedbackSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display font-semibold text-[18px] tracking-tight text-white flex items-center gap-2">
        <Award className="w-5 h-5 text-primary" />
        <span>AI Feedback Report</span>
      </h2>

      {/* Ratings row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-3 gap-3"
      >
        <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-body-muted/55 font-mono">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Score</span>
          </div>
          <span className={`text-[28px] font-bold font-display tracking-tight ${
            feedback.score >= 80 ? 'text-emerald-400' : feedback.score >= 60 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {feedback.score}%
          </span>
        </div>
        <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-body-muted/55 font-mono">
            <FileText className="w-3.5 h-3.5" />
            <span>Technical</span>
          </div>
          <span className="text-[22px] font-bold font-display tracking-tight text-white">{feedback.technicalRating.toFixed(1)}</span>
          <span className="text-[10px] text-body-muted/25 font-mono">/ 5.0</span>
        </div>
        <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-4 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[11px] text-body-muted/55 font-mono">
            <MessageSquareText className="w-3.5 h-3.5" />
            <span>Communication</span>
          </div>
          <span className="text-[22px] font-bold font-display tracking-tight text-white">{feedback.communicationRating.toFixed(1)}</span>
          <span className="text-[10px] text-body-muted/25 font-mono">/ 5.0</span>
        </div>
      </motion.div>

      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-4 flex flex-col gap-2"
      >
        <span className="text-[11px] text-body-muted/60 font-semibold font-mono">Evaluation Summary</span>
        <p className="text-body-muted/70 text-[14px] leading-relaxed italic">
          &ldquo;{feedback.summary}&rdquo;
        </p>
      </motion.div>

      {/* Detailed Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-4 flex flex-col gap-2"
      >
        <span className="text-[11px] text-body-muted/60 font-semibold font-mono">Detailed Analysis</span>
        <div className="text-body-muted/60 text-[13px] leading-relaxed font-mono whitespace-pre-wrap bg-surface-black border border-white/[0.06] rounded-md p-4">
          {feedback.detailedReview}
        </div>
      </motion.div>
    </div>
  );
}
