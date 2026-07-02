'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Award } from 'lucide-react';
import { Card } from '../ui/Card';
import { CodeReplaySkeleton } from '../ui/Skeleton';
import type { InterviewDetails } from '../../store/useInterviewStore';

const CodePlaybackPlayer = dynamic(
  () => import('../ui/CodePlaybackPlayer').then((mod) => mod.CodePlaybackPlayer),
  {
    ssr: false,
    loading: () => <CodeReplaySkeleton />,
  }
);

interface AIFeedbackPanelProps {
  interview: InterviewDetails;
  onClose: () => void;
}

export function AIFeedbackPanel({ interview, onClose }: AIFeedbackPanelProps) {
  const feedback = interview.feedback;

  return (
    <Card variant="ghost" className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h3 className="font-display font-semibold text-h3 text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <span>AI Feedback Report</span>
        </h3>
        <button
          onClick={onClose}
          className="text-body-muted/55 hover:text-white text-[12px]"
        >
          Close
        </button>
      </div>

      <div className="flex items-center justify-around bg-white/[0.02] border border-white/[0.06] rounded-md p-4">
        <div className="text-center">
          <span className="text-[12px] text-body-muted/55 block">Final Score</span>
          <span className="text-[34px] font-bold text-white tracking-tight">{feedback?.score}%</span>
        </div>
        <div className="w-[1px] h-10 bg-white/[0.06]" />
        <div className="text-center">
          <span className="text-[12px] text-body-muted/55 block">Technical</span>
          <span className="text-[17px] font-semibold text-white block">{feedback?.technicalRating} / 5.0</span>
        </div>
        <div className="w-[1px] h-10 bg-white/[0.06]" />
        <div className="text-center">
          <span className="text-[12px] text-body-muted/55 block">Communication</span>
          <span className="text-[17px] font-semibold text-white block">{feedback?.communicationRating} / 5.0</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] text-body-muted/80 font-semibold">Evaluation Summary</span>
        <p className="text-body-muted/70 text-[14px] leading-relaxed italic bg-white/[0.02] p-3 border border-white/[0.06] rounded-md">
          &ldquo;{feedback?.summary}&rdquo;
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] text-body-muted/80 font-semibold">Detailed Analysis</span>
        <div className="text-body-muted/60 text-[13px] leading-relaxed font-mono whitespace-pre-wrap bg-surface-black border border-white/[0.06] p-4 rounded-md">
          {feedback?.detailedReview}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[12px] text-body-muted/80 font-semibold">Session Code Replay</span>
        <CodePlaybackPlayer codeHistory={interview.codeHistory} />
      </div>
    </Card>
  );
}
