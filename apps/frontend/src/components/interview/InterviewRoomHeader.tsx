'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { ConnectionHealth } from '../ui/ConnectionHealth';
import type { PeerConnectionState } from '../../store/useInterviewStore';

interface InterviewRoomHeaderProps {
  title: string;
  elapsedSeconds: number;
  formatTime: (secs: number) => string;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  peers: PeerConnectionState[];
  onExit: () => void;
}

export function InterviewRoomHeader({
  title,
  elapsedSeconds,
  formatTime,
  connectionStatus,
  peers,
  onExit,
}: InterviewRoomHeaderProps) {
  return (
    <header className="h-11 bg-surface-black border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-7 h-7 rounded-lg text-body-muted/60 hover:text-white hover:bg-white/[0.04] transition-colors shrink-0"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-[14px] font-semibold text-white truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.03] border border-white/[0.06] rounded-full text-[12px] font-mono text-body-muted/70">
          <Clock className="w-3.5 h-3.5 text-primary-on-dark/60" />
          <span>{formatTime(elapsedSeconds)}</span>
        </div>
        <ConnectionHealth status={connectionStatus} peers={peers} />
        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label="Exit interview room"
        >
          Exit
        </button>
      </div>
    </header>
  );
}
