'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, Cpu, Shield, StickyNote, RefreshCw,
  Loader2, FileText, Send, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { useInterviewStore } from '../../../../store/useInterviewStore';
import { Button } from '../../../../components/ui/Button';
import { hoverScale } from '../../../../lib/motion';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ProctoringPanel } from './ProctoringPanel';
import { NotesPanel } from './NotesPanel';
import { useIsMobile } from '../../../../hooks/useIsMobile';

type TabId = 'transcript' | 'chat' | 'copilot' | 'proctoring' | 'notes';

interface RightPanelProps {
  socket: any;
  roomId: string;
  isRecording: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  copilotQuestions: { question: string; hint: string }[];
  isGeneratingCopilot: boolean;
  fetchCopilotSuggestions: () => void;
  expandedCopilotIdx: number | null;
  setExpandedCopilotIdx: (idx: number | null) => void;
}

const TAB_ICONS: Record<TabId, React.ElementType> = {
  transcript: Sparkles,
  chat: MessageSquare,
  copilot: Cpu,
  proctoring: Shield,
  notes: StickyNote,
};

const TAB_LABELS: Record<TabId, string> = {
  transcript: 'Transcript',
  chat: 'Chat',
  copilot: 'Copilot',
  proctoring: 'Proctoring',
  notes: 'Notes',
};

const ease = [0.22, 1, 0.36, 1] as const;

export const RightPanel: React.FC<RightPanelProps> = ({
  socket, roomId, isRecording,
  activeTab, setActiveTab,
  copilotQuestions, isGeneratingCopilot, fetchCopilotSuggestions,
  expandedCopilotIdx, setExpandedCopilotIdx,
}) => {
  const isMobile = useIsMobile();
  const { user, chatMessages, transcriptItems, proctoringLogs } = useInterviewStore();
  const [chatInput, setChatInput] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadProctoring, setUnreadProctoring] = useState(0);

  const lastChatCountRef = useRef(chatMessages.length);
  const lastProctoringCountRef = useRef(proctoringLogs.length);

  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChat(0);
      lastChatCountRef.current = chatMessages.length;
    } else {
      const diff = chatMessages.length - lastChatCountRef.current;
      setUnreadChat(diff > 0 ? diff : 0);
    }
  }, [chatMessages.length, activeTab]);

  useEffect(() => {
    if (activeTab === 'proctoring') {
      setUnreadProctoring(0);
      lastProctoringCountRef.current = proctoringLogs.length;
    } else {
      const diff = proctoringLogs.length - lastProctoringCountRef.current;
      setUnreadProctoring(diff > 0 ? diff : 0);
    }
  }, [proctoringLogs.length, activeTab]);

  useEffect(() => {
    if (activeTab === 'transcript') {
      transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcriptItems, activeTab]);

  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeTab]);

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !user) return;
    socket.emit('chat-message', {
      interviewId: roomId,
      senderId: user.id,
      senderName: user.name,
      text: chatInput,
    });
    setChatInput('');
  };

  const handleTabClick = (tab: TabId) => {
    if (isCollapsed) {
      setActiveTab(tab);
      setIsCollapsed(false);
    } else if (activeTab === tab) {
      setIsCollapsed(true);
    } else {
      setActiveTab(tab);
    }
  };

  const availableTabs: TabId[] = user?.role === 'INTERVIEWER'
    ? ['transcript', 'chat', 'notes', 'copilot', 'proctoring']
    : ['transcript', 'chat', 'notes'];

  return (
    <motion.div
      animate={isMobile ? {} : { width: isCollapsed ? 48 : 380 }}
      transition={{ duration: 0.35, ease }}
      className="bg-surface-tile-1 border border-white/[0.06] rounded-lg overflow-hidden flex shrink-0 w-full md:w-auto h-full"
    >
      {/* Collapsed Tab Strip */}
      <AnimatePresence>
        {isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-1 w-12 py-3 shrink-0"
          >
            {availableTabs.map((tab) => {
              const Icon = TAB_ICONS[tab];
              const isUnread = tab === 'chat' ? unreadChat > 0 : tab === 'proctoring' ? unreadProctoring > 0 : false;
              return (
                <motion.button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`relative w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    activeTab === tab
                      ? 'bg-primary/15 text-primary-on-dark'
                      : 'text-body-muted/70 hover:text-white hover:bg-white/[0.04]'
                  }`}
                  title={TAB_LABELS[tab]}
                  aria-label={TAB_LABELS[tab]}
                  {...hoverScale}
                >
                  <Icon className="w-4 h-4" />
                  {isUnread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </motion.button>
              );
            })}
            <div className="flex-1" />
            <Tooltip content="Expand panel">
              <button
                onClick={() => setIsCollapsed(false)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-all"
                aria-label="Expand panel"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </Tooltip>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Content */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col min-w-0 overflow-hidden"
          >
            {/* Header with collapse button */}
            <div className="h-10 bg-surface-tile-2 border-b border-white/[0.06] flex items-center justify-between px-2 sm:px-4 gap-2 shrink-0">
              <div className="flex gap-1 sm:gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1" role="tablist">
                {availableTabs.map((tab) => {
                  const Icon = TAB_ICONS[tab];
                  const isUnread = tab === 'chat' ? unreadChat > 0 : tab === 'proctoring' ? unreadProctoring > 0 : false;
                  return (
                    <motion.button
                      key={tab}
                      role="tab"
                      aria-selected={activeTab === tab}
                      aria-controls={`panel-right-${tab}`}
                      onClick={() => setActiveTab(tab)}
                      className={`text-[11px] sm:text-[12px] font-semibold flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded transition-all shrink-0 ${
                        activeTab === tab
                          ? 'text-white bg-white/[0.04] border border-white/[0.06]'
                          : 'text-body-muted/70 hover:text-body-muted border border-transparent'
                      }`}
                      {...hoverScale}
                    >
                      <Icon className="w-3.5 h-3.5 text-primary-on-dark" />
                      <span className="hidden sm:inline">{TAB_LABELS[tab]}</span>
                      {isUnread && (
                        <span className="ml-0.5 px-1.5 py-0.5 text-[9px] font-semibold bg-primary text-white rounded-pill leading-none">
                          {tab === 'chat' ? unreadChat : unreadProctoring}
                        </span>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeTab === 'transcript' && isRecording && (
                  <span className="text-[11px] text-primary-on-dark animate-pulse flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-on-dark" />
                    <span className="hidden sm:inline">Streaming...</span>
                  </span>
                )}
                {activeTab === 'copilot' && (
                  <div className="flex items-center gap-2">
                    {isGeneratingCopilot && (
                      <span className="text-[10px] text-body-muted/50 font-mono flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                      </span>
                    )}
                    <Tooltip content="Refresh AI Suggestions">
                      <button
                        onClick={fetchCopilotSuggestions}
                        disabled={isGeneratingCopilot}
                        className="p-1 rounded hover:bg-white/[0.04] text-primary hover:text-white transition-all focus:outline-none focus:ring-1 focus:ring-primary/50"
                        aria-label="Refresh suggestions"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCopilot ? 'animate-spin' : ''}`} />
                      </button>
                    </Tooltip>
                  </div>
                )}
                <Tooltip content="Collapse panel">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="w-6 h-6 rounded flex items-center justify-center text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-all"
                    aria-label="Collapse panel"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </Tooltip>
              </div>
            </div>

            {/* Panel Body */}
            <div
              role="tabpanel"
              id={`panel-right-${activeTab}`}
              className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col min-h-0"
            >
              {activeTab === 'transcript' ? (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                  {transcriptItems.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="w-4 h-4" />}
                      description={isRecording ? 'Waiting for speech...' : 'Start recording to transcribe.'}
                      compact
                    />
                  ) : (
                    transcriptItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-1 text-[13px] bg-white/[0.01] border border-white/[0.06] p-2.5 rounded-md">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-primary-on-dark">{item.speakerName}</span>
                          <span className="text-[10px] text-body-muted/50 font-mono">{item.timestamp}</span>
                        </div>
                        <p className="text-white/80 leading-relaxed font-sans">{item.text}</p>
                      </div>
                    ))
                  )}
                  <div ref={transcriptEndRef} />
                </div>
              ) : activeTab === 'chat' ? (
                <div className="flex flex-col h-full justify-between">
                  <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 mb-2">
                    {chatMessages.length === 0 ? (
                      <EmptyState
                        icon={<MessageSquare className="w-4 h-4" />}
                        description="No messages yet."
                        compact
                      />
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex flex-col max-w-[85%] rounded p-2.5 text-[13px] ${
                            msg.senderId === user?.id
                              ? 'bg-primary/10 border border-primary/20 self-end text-white'
                              : 'bg-white/[0.02] border border-white/[0.06] self-start text-white/90'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1 justify-between">
                            <span className="font-semibold text-primary-on-dark text-[11px]">{msg.senderName}</span>
                            <span className="text-[9px] opacity-40 font-mono">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-sans leading-relaxed">{msg.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <form onSubmit={handleSendChatMessage} className="flex gap-2 shrink-0">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Send message..."
                      aria-label="Chat message input"
                      className="flex-1 bg-surface-black border border-white/[0.06] focus:border-primary-focus focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-pill px-4 py-1.5 text-[13px]"
                    />
                    <Button type="submit" variant="primary" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </form>
                </div>
              ) : activeTab === 'notes' ? (
                <NotesPanel />
              ) : activeTab === 'proctoring' ? (
                <ProctoringPanel />
              ) : (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
                  {copilotQuestions.length === 0 ? (
                    <EmptyState
                      icon={<Cpu className="w-4 h-4" />}
                      description={isGeneratingCopilot ? 'Formulating questions...' : 'Waiting for activity to trigger Copilot.'}
                      compact
                    />
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-[11px] font-mono text-body-muted/70 border-b border-white/[0.06] pb-2">
                        <span>AI Interviewer Assistant</span>
                        <span>Contextual</span>
                      </div>
                      {copilotQuestions.map((q, idx) => {
                        const isExpanded = expandedCopilotIdx === idx;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col gap-2 bg-white/[0.01] hover:bg-white/[0.02] border border-white/[0.06] p-3 rounded-lg transition-all"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex gap-2">
                                <span className="text-primary font-mono font-bold text-[12px]">Q{idx + 1}.</span>
                                <p className="text-[13px] text-white/90 leading-relaxed font-sans font-medium select-text">{q.question}</p>
                              </div>
                              <button
                                onClick={() => setExpandedCopilotIdx(isExpanded ? null : idx)}
                                className="text-[10px] text-primary hover:text-white font-mono shrink-0 select-none focus:outline-none focus:ring-1 focus:ring-primary/40 rounded"
                              >
                                {isExpanded ? 'Hide' : 'Hint'}
                              </button>
                            </div>
                            {isExpanded && (
                              <div className="bg-primary/5 border border-primary/10 p-2.5 rounded text-[12px] text-white/80 font-sans leading-relaxed select-text mt-1">
                                <strong className="text-primary-on-dark block text-[11px] font-mono mb-1">Scoring Guide:</strong>
                                {q.hint}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
