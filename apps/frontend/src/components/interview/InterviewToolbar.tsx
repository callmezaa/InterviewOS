'use client';

import React from 'react';
import { Code, Beaker, Palette, Radio, Scan, PanelRightClose, PanelRightOpen, Award, LogOut } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

interface InterviewToolbarProps {
  activeMainTab: 'editor' | 'tests' | 'whiteboard';
  onTabChange: (tab: 'editor' | 'tests' | 'whiteboard') => void;
  isInterviewer: boolean;
  isRecording: boolean;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  rightPanelOpen: boolean;
  onToggleRightPanel: () => void;
  onShowShortcuts: () => void;
  onEvaluate: () => void;
  onExit: () => void;
}

export function InterviewToolbar({
  activeMainTab,
  onTabChange,
  isInterviewer,
  isRecording,
  focusMode,
  onToggleFocusMode,
  rightPanelOpen,
  onToggleRightPanel,
  onShowShortcuts,
  onEvaluate,
  onExit,
}: InterviewToolbarProps) {
  const btnClass = "flex items-center justify-center h-7 px-2 rounded-md text-[12px] font-medium transition-all duration-150";
  const activeClass = "bg-white/[0.08] text-white";
  const inactiveClass = "text-body-muted/50 hover:text-white hover:bg-white/[0.04]";

  return (
    <div className="h-10 bg-surface-black border-b border-white/[0.06] flex items-center justify-between px-3 shrink-0">
      {/* Left section: Tabs */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onTabChange('editor')}
          className={`${btnClass} ${activeMainTab === 'editor' ? activeClass : inactiveClass}`}
          aria-label="Code Editor"
        >
          <Code className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline">Editor</span>
        </button>
        <button
          onClick={() => onTabChange('tests')}
          className={`${btnClass} ${activeMainTab === 'tests' ? activeClass : inactiveClass}`}
          aria-label="Tests"
        >
          <Beaker className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline">Tests</span>
        </button>
        <button
          onClick={() => onTabChange('whiteboard')}
          className={`${btnClass} ${activeMainTab === 'whiteboard' ? activeClass : inactiveClass}`}
          aria-label="Whiteboard"
        >
          <Palette className="w-3.5 h-3.5 mr-1.5" />
          <span className="hidden sm:inline">Board</span>
        </button>
      </div>

      {/* Right section: Action buttons */}
      <div className="flex items-center gap-1">
        {isRecording && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-md text-[11px] mr-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-semibold">Rec</span>
          </div>
        )}

        <Tooltip content={focusMode ? 'Exit focus mode' : 'Enter focus mode'} shortcut="F" side="bottom">
          <button
            onClick={onToggleFocusMode}
            className={`${btnClass} ${focusMode ? 'bg-primary text-white' : inactiveClass}`}
            aria-label={focusMode ? 'Exit focus mode' : 'Enter focus mode'}
          >
            <Scan className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        <Tooltip content={rightPanelOpen ? 'Close side panel' : 'Open side panel'} shortcut="P" side="bottom">
          <button
            onClick={onToggleRightPanel}
            className={`${btnClass} ${inactiveClass}`}
            aria-label={rightPanelOpen ? 'Close side panel' : 'Open side panel'}
          >
            {rightPanelOpen ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>

        <Tooltip content="Keyboard shortcuts" shortcut="?" side="bottom">
          <button
            onClick={onShowShortcuts}
            className={`${btnClass} ${inactiveClass} font-mono text-[14px] font-semibold`}
            aria-label="Keyboard shortcuts"
          >
            ?
          </button>
        </Tooltip>

        {isInterviewer && (
          <Tooltip content="Evaluate & End Session" side="bottom">
            <button
              onClick={onEvaluate}
              className={`${btnClass} ${inactiveClass}`}
              aria-label="Evaluate and end session"
            >
              <Award className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}

        <Tooltip content="Exit room" side="bottom">
          <button
            onClick={onExit}
            className={`${btnClass} text-red-400 hover:bg-red-500/10`}
            aria-label="Exit interview room"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
