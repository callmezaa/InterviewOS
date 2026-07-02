'use client';

import React from 'react';
import { MessageSquare } from 'lucide-react';
import type { TranscriptItem } from '../../../../store/useInterviewStore';
import { EmptyState } from '../../../../components/ui/EmptyState';

interface TranscriptPanelProps {
  transcript: TranscriptItem[];
}

export function TranscriptPanel({ transcript }: TranscriptPanelProps) {
  if (!transcript || transcript.length === 0) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg p-6">
        <EmptyState
          icon={<MessageSquare className="w-4 h-4" />}
          title="No transcript available"
          description="Transcript data was not captured for this session."
        />
      </div>
    );
  }

  return (
    <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06]">
        <MessageSquare className="w-4 h-4 text-primary" />
        <span className="text-[12px] font-semibold text-white/70">Transcript</span>
        <span className="text-[10px] font-mono text-body-muted/50 ml-auto">{transcript.length} entries</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto p-4 flex flex-col gap-2">
        {transcript.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-primary-on-dark/70 font-mono">{item.speakerName}</span>
              <span className="text-[9px] font-mono text-body-muted/20">
                {new Date(item.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>
            <p className="text-[12px] text-body-muted/60 leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
