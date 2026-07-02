import React, { useState, useEffect, useRef } from 'react';
import { useInterviewStore } from '../../../../store/useInterviewStore';
import {
  Sparkles, MessageSquare, Cpu, Shield, StickyNote, RefreshCw,
  Loader2, FileText, Send
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Tooltip } from '../../../../components/ui/Tooltip';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { ProctoringPanel } from './ProctoringPanel';
import { NotesPanel } from './NotesPanel';

interface SidebarPanelProps {
  socket: any;
  roomId: string;
  isRecording: boolean;
  activeTab: 'transcript' | 'chat' | 'copilot' | 'proctoring' | 'notes';
  setActiveTab: (tab: 'transcript' | 'chat' | 'copilot' | 'proctoring' | 'notes') => void;
  copilotQuestions: { question: string; hint: string }[];
  isGeneratingCopilot: boolean;
  fetchCopilotSuggestions: () => void;
  expandedCopilotIdx: number | null;
  setExpandedCopilotIdx: (idx: number | null) => void;
}

export const SidebarPanel: React.FC<SidebarPanelProps> = ({
  socket,
  roomId,
  isRecording,
  activeTab,
  setActiveTab,
  copilotQuestions,
  isGeneratingCopilot,
  fetchCopilotSuggestions,
  expandedCopilotIdx,
  setExpandedCopilotIdx,
}) => {
  const { user, chatMessages, transcriptItems, proctoringLogs } = useInterviewStore();
  const [chatInput, setChatInput] = useState('');

  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const [unreadChat, setUnreadChat] = useState(0);
  const [unreadProctoring, setUnreadProctoring] = useState(0);

  const lastChatCountRef = useRef(chatMessages.length);
  const lastProctoringCountRef = useRef(proctoringLogs.length);

  // Sync / Reset Chat unread count
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadChat(0);
      lastChatCountRef.current = chatMessages.length;
    } else {
      const diff = chatMessages.length - lastChatCountRef.current;
      setUnreadChat(diff > 0 ? diff : 0);
    }
  }, [chatMessages.length, activeTab]);

  // Sync / Reset Proctoring unread count
  useEffect(() => {
    if (activeTab === 'proctoring') {
      setUnreadProctoring(0);
      lastProctoringCountRef.current = proctoringLogs.length;
    } else {
      const diff = proctoringLogs.length - lastProctoringCountRef.current;
      setUnreadProctoring(diff > 0 ? diff : 0);
    }
  }, [proctoringLogs.length, activeTab]);

  // Smooth scroll transcripts and chats to the end when updated
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

  return (
    <div className="flex-[2] bg-surface-tile-1 border border-white/[0.06] rounded-lg overflow-hidden flex flex-col min-h-[180px]">
      
      {/* Panel Tabs */}
      <div className="h-10 bg-surface-tile-2 border-b border-white/[0.06] flex items-center justify-between px-4 gap-4 overflow-hidden">
        <div className="flex gap-2 overflow-x-auto flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'transcript'}
            aria-controls="panel-sidebar-transcript"
            onClick={() => setActiveTab('transcript')}
            className={`text-[12px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded transition-all shrink-0 ${
              activeTab === 'transcript' ? 'text-white bg-white/[0.04] border border-white/[0.06]' : 'text-body-muted/70 hover:text-body-muted'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-primary-on-dark" />
            <span>Live Whisper Transcript</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'chat'}
            aria-controls="panel-sidebar-chat"
            onClick={() => setActiveTab('chat')}
            className={`text-[12px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded transition-all shrink-0 ${
              activeTab === 'chat' ? 'text-white bg-white/[0.04] border border-white/[0.06]' : 'text-body-muted/70 hover:text-body-muted'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-primary-on-dark" />
            <span>Team Chat</span>
            {unreadChat > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold bg-primary text-white rounded-pill leading-none">
                {unreadChat}
              </span>
            )}
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'notes'}
            aria-controls="panel-sidebar-notes"
            onClick={() => setActiveTab('notes')}
            className={`text-[12px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded transition-all shrink-0 ${
              activeTab === 'notes' ? 'text-white bg-white/[0.04] border border-white/[0.06]' : 'text-body-muted/70 hover:text-body-muted'
            }`}
          >
            <StickyNote className="w-3.5 h-3.5 text-primary-on-dark" />
            <span>Quick Notes</span>
          </button>
          {user?.role === 'INTERVIEWER' && (
            <>
              <button
                role="tab"
                aria-selected={activeTab === 'copilot'}
                aria-controls="panel-sidebar-copilot"
                onClick={() => setActiveTab('copilot')}
                className={`text-[12px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded transition-all shrink-0 ${
                  activeTab === 'copilot' ? 'text-white bg-white/[0.04] border border-white/[0.06]' : 'text-body-muted/70 hover:text-body-muted'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 text-primary-on-dark" />
                <span>AI Copilot (Private)</span>
              </button>
              <button
                role="tab"
                aria-selected={activeTab === 'proctoring'}
                aria-controls="panel-sidebar-proctoring"
                onClick={() => setActiveTab('proctoring')}
                className={`text-[12px] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded transition-all shrink-0 ${
                  activeTab === 'proctoring' ? 'text-white bg-white/[0.04] border border-white/[0.06]' : 'text-body-muted/70 hover:text-body-muted'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>AI Proctoring Logs</span>
                {unreadProctoring > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[9px] font-semibold bg-primary text-white rounded-pill leading-none">
                    {unreadProctoring}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {activeTab === 'transcript' && isRecording && (
          <span className="text-[11px] text-primary-on-dark animate-pulse flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-on-dark" />
            Streaming speech to text...
          </span>
        )}

        {activeTab === 'copilot' && (
          <div className="flex items-center gap-2">
            {isGeneratingCopilot && (
              <span className="text-[10px] text-body-muted/50 font-mono flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
              </span>
            )}
            <Tooltip content="Refresh AI Suggestions">
              <button
                onClick={fetchCopilotSuggestions}
                disabled={isGeneratingCopilot}
                className="p-1.5 rounded hover:bg-white/[0.04] text-primary hover:text-white transition-all focus:outline-none focus:ring-1 focus:ring-primary/50"
                aria-label="Refresh suggestions"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingCopilot ? 'animate-spin' : ''}`} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Panel Body Content */}
      <div
        role="tabpanel"
        id={`panel-sidebar-${activeTab}`}
        className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0"
      >
        
        {activeTab === 'transcript' ? (
          /* Whisper Transcript timelines */
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
            {transcriptItems.length === 0 ? (
              <EmptyState
                icon={<FileText className="w-4 h-4" />}
                description={isRecording ? 'Waiting for conversation speech...' : 'Start recording to initiate transcription.'}
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
          /* Text chat communication logs */
          <div className="flex flex-col h-full justify-between">
            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-2 mb-2">
              {chatMessages.length === 0 ? (
                <EmptyState
                  icon={<MessageSquare className="w-4 h-4" />}
                  description="No chat logs. Send a message to coordinate."
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

            {/* Send message text form */}
            <form onSubmit={handleSendChatMessage} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send message to room..."
                aria-label="Chat message input"
                title="Type a message to send to the room"
                className="flex-1 bg-surface-black border border-white/[0.06] focus:border-primary-focus focus:outline-none focus:ring-1 focus:ring-primary/40 rounded-pill px-4 py-1.5 text-[13px]"
              />
              <Button
                type="submit"
                variant="primary"
                className="h-8 w-8 rounded-full p-0 flex items-center justify-center bg-primary"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </form>
          </div>
        ) : activeTab === 'notes' ? (
          <NotesPanel />
        ) : activeTab === 'proctoring' ? (
          /* AI Proctoring Logs (Visible to Interviewer) */
          <ProctoringPanel />
        ) : (
          /* AI Copilot Tab View (Visible to Interviewer) */
          <div className="flex-1 flex flex-col gap-3 overflow-y-auto pr-2">
            {copilotQuestions.length === 0 ? (
              <EmptyState
                icon={<Cpu className="w-4 h-4" />}
                description={isGeneratingCopilot ? 'Gemini AI is formulating questions...' : 'Waiting for conversation or code in the editor to trigger Copilot.'}
                compact
              />
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-body-muted/70 border-b border-white/[0.06] pb-2">
                  <span>AI Interviewer Assistant</span>
                  <span>Contextual from recent activity</span>
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
    </div>
  );
};
