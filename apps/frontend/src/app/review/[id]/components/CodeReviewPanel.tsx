'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { Code, FileCode } from 'lucide-react';
import { CodeReplaySkeleton } from '../../../../components/ui/Skeleton';
import type { InterviewDetails } from '../../../../store/useInterviewStore';

const CodePlaybackPlayer = dynamic(
  () => import('../../../../components/ui/CodePlaybackPlayer').then((mod) => mod.CodePlaybackPlayer),
  {
    ssr: false,
    loading: () => <CodeReplaySkeleton />,
  }
);

interface CodeReviewPanelProps {
  interview: InterviewDetails;
}

export function CodeReviewPanel({ interview }: CodeReviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display font-semibold text-[18px] tracking-tight text-white flex items-center gap-2">
        <Code className="w-5 h-5 text-primary" />
        <span>Session Code Replay</span>
      </h2>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white/[0.01] border border-white/[0.06] rounded-lg overflow-hidden"
      >
        {/* Language indicator */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
          <FileCode className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-medium text-white/70">{interview.language.charAt(0).toUpperCase() + interview.language.slice(1)}</span>
          <span className="text-[10px] font-mono text-body-muted/25 ml-auto">
            {interview.codeHistory?.length || 0} snapshots
          </span>
        </div>
        <div className="p-4">
          <CodePlaybackPlayer codeHistory={interview.codeHistory} />
        </div>
      </motion.div>
    </div>
  );
}
