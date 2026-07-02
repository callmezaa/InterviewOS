'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, SkipBack, SkipForward, Clock, Code, RefreshCw, BarChart2, Zap, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { Tooltip } from './Tooltip';
import { EmptyState } from './EmptyState';
import { CodeReplaySkeleton } from './Skeleton';

// Dynamic import of Monaco Editor to avoid SSR errors
const MonacoEditor = dynamic(
  () => import('@monaco-editor/react').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <CodeReplaySkeleton />,
  }
);

interface HistorySnapshot {
  codeContent: string;
  language: string;
  timestamp: string;
}

interface CodePlaybackPlayerProps {
  codeHistory: HistorySnapshot[] | any;
}

export const CodePlaybackPlayer: React.FC<CodePlaybackPlayerProps> = ({ codeHistory }) => {
  const snapshots: HistorySnapshot[] = Array.isArray(codeHistory) ? codeHistory : [];
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 5x, 10x

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback timer ticker
  useEffect(() => {
    if (isPlaying) {
      const stepTime = 1000 / speed;
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= snapshots.length - 1) {
            setIsPlaying(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return prev;
          }
          return prev + 1;
        });
      }, stepTime);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, snapshots.length]);

  // Derived stats from the snapshot changes
  const sessionStats = useMemo(() => {
    if (snapshots.length === 0) return { charactersTyped: 0, timeSpanMin: 0, keystrokeRate: 0 };

    let totalChars = 0;
    for (let i = 0; i < snapshots.length; i++) {
      const prevLen = i > 0 ? snapshots[i - 1].codeContent.length : 0;
      const currLen = snapshots[i].codeContent.length;
      totalChars += Math.abs(currLen - prevLen);
    }

    const firstTime = new Date(snapshots[0].timestamp).getTime();
    const lastTime = new Date(snapshots[snapshots.length - 1].timestamp).getTime();
    const durationMin = parseFloat(((lastTime - firstTime) / 60000).toFixed(1));

    return {
      charactersTyped: totalChars,
      timeSpanMin: durationMin || 0.1,
      keystrokeRate: Math.round(totalChars / (durationMin || 0.1)),
    };
  }, [snapshots]);

  if (snapshots.length === 0) {
    return (
      <div className="bg-white/[0.01] border border-white/[0.06] rounded-lg h-[220px] flex items-center justify-center">
        <EmptyState
          icon={<Code className="w-4 h-4" />}
          description="No typing history snapshots captured for this room."
        />
      </div>
    );
  }

  const currentSnapshot = snapshots[currentIndex];
  const timeStr = currentSnapshot ? new Date(currentSnapshot.timestamp).toLocaleTimeString() : '';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentIndex(parseInt(e.target.value, 10));
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const handleEditorMount = (_editor: any, monaco: any) => {
    monaco.editor.defineTheme('playback-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'c084fc' },
      ],
      colors: {
        'editor.background': '#050505',
        'editor.foreground': '#9ca3af',
        'editorLineNumber.foreground': '#1f2937',
        'editorLineNumber.activeForeground': '#4b5563',
        'editor.lineHighlightBackground': '#ffffff05',
      },
    });
    monaco.editor.setTheme('playback-dark');
  };

  return (
    <div className="flex flex-col gap-4 bg-surface-black border border-white/[0.06] rounded-lg p-4 overflow-hidden">
      
      {/* Playback statistics panel */}
      <div className="grid grid-cols-3 gap-3 bg-white/[0.02] border border-white/[0.06] p-3 rounded-lg text-center select-none shrink-0 font-mono">
        <div>
          <span className="text-[9px] text-body-muted/50 block">Activity Delta</span>
          <span className="text-[13px] font-semibold text-primary-on-dark">+{sessionStats.charactersTyped} chars</span>
        </div>
        <div className="border-l border-white/[0.06]">
          <span className="text-[9px] text-body-muted/50 block">Coding Span</span>
          <span className="text-[13px] font-semibold text-white/95">{sessionStats.timeSpanMin} min</span>
        </div>
        <div className="border-l border-white/[0.06]">
          <span className="text-[9px] text-body-muted/50 block">Keys / Min</span>
          <span className="text-[13px] font-semibold text-primary-on-dark">{sessionStats.keystrokeRate} cpm</span>
        </div>
      </div>

      {/* Viewport Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <Code className="w-3.5 h-3.5 text-primary" />
          <span className="text-[11px] font-mono text-white/70">Interactive Code Replay</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-body-muted/55">
          <Clock className="w-3 h-3" />
          <span>Snapshot {currentIndex + 1} / {snapshots.length} (@ {timeStr})</span>
        </div>
      </div>

      {/* Code viewport using Monaco */}
      <div className="h-[240px] border border-white/[0.06] rounded-lg overflow-hidden relative bg-editor-bg">
        <MonacoEditor
          height="100%"
          language={currentSnapshot?.language || 'javascript'}
          value={currentSnapshot?.codeContent || ''}
          onMount={handleEditorMount}
          theme="playback-dark"
          options={{
            readOnly: true,
            fontSize: 12.5,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            scrollbar: { verticalScrollbarSize: 4, horizontalScrollbarSize: 4 },
            padding: { top: 8, bottom: 8 },
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Scrubber slider */}
      <div className="flex items-center gap-4 py-1 shrink-0">
        <label htmlFor="playback-scrubber" className="sr-only">Replay Timeline</label>
        <input
          id="playback-scrubber"
          type="range"
          min={0}
          max={snapshots.length - 1}
          value={currentIndex}
          onChange={handleSliderChange}
          className="flex-1 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
          title="Timeline Scrubber"
        />
      </div>

      {/* Control Actions toolbar */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Tooltip content="Reset to beginning">
            <Button
              variant="ghost"
              onClick={handleReset}
              className="p-1.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white text-body-muted/60"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>

          <Tooltip content="Previous Snapshot">
            <Button
              variant="ghost"
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-1.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white text-body-muted/60 disabled:opacity-30"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>

          <Tooltip content={isPlaying ? 'Pause' : 'Play'}>
            <Button
              variant="primary"
              onClick={() => setIsPlaying(!isPlaying)}
              className="h-8 px-4 flex items-center justify-center gap-1.5"
            >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 text-white" />
                <span className="text-[12px]">Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-white fill-current" />
                <span className="text-[12px]">Play</span>
              </>
            )}
            </Button>
          </Tooltip>

          <Tooltip content="Next Snapshot">
            <Button
              variant="ghost"
              onClick={() => setCurrentIndex((prev) => Math.min(snapshots.length - 1, prev + 1))}
              disabled={currentIndex === snapshots.length - 1}
              className="p-1.5 bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white text-body-muted/60 disabled:opacity-30"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </Button>
          </Tooltip>
        </div>

        {/* Playback speed selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-body-muted/50 font-mono">Speed</span>
          <Tooltip content="Select playback speed">
            <select
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              aria-label="Playback speed"
              className="bg-surface-tile-3 text-[11px] text-body-muted border border-white/[0.06] rounded px-2 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            >
            <option value={0.5}>0.5x</option>
            <option value={1}>1.0x</option>
            <option value={2}>2.0x</option>
            <option value={5}>5.0x</option>
            <option value={10}>10x</option>
            </select>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

