'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Calendar, Copy, Check, ExternalLink } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface Message {
  role: 'ai' | 'user';
  content: string;
  actions?: { label: string; action: string }[];
}

const quickActions = [
  { label: 'How to schedule an interview', icon: Calendar },
  { label: 'Platform status', icon: Sparkles },
  { label: 'Invite a candidate', icon: Send },
  { label: 'Best practices', icon: Sparkles },
];

const initialMessages: Message[] = [
  {
    role: 'ai',
    content:
      "Hi! I'm your InterviewOS support assistant. I can help you with scheduling, troubleshooting, best practices, or anything else about the platform. What can I help you with?",
    actions: [
      { label: 'Schedule an interview', action: 'schedule' },
      { label: 'Check platform status', action: 'status' },
      { label: 'View tutorials', action: 'tutorials' },
      { label: 'Talk to a human', action: 'human' },
    ],
  },
];

const aiResponses: Record<string, string> = {
  schedule:
    "To schedule an interview:\n\n1. Go to your Dashboard\n2. Fill in the title, description, and candidate email\n3. Pick a date and time\n4. Click 'Schedule Interview'\n\nThe candidate will receive an invite link instantly. You can also use the command palette (Cmd+K) and type 'schedule' for a faster workflow.",
  status:
    "All InterviewOS services are currently operational. You can view detailed status metrics including uptime, latency, and active connections on the System Status page. I'd recommend checking there for real-time updates.",
  tutorials: 'We have a library of short video tutorials covering every feature of InterviewOS. Head over to the Video Tutorials section to browse by category.',
  human: "I understand you'd like to speak with a human. Please describe your issue and I'll escalate it to our support team. For Enterprise plans, expect a response within 30 minutes.",
  default:
    "I'll help you with that! Could you provide a bit more detail so I can give you the most accurate assistance?",
};

export function AISupportAgent() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const addMessage = (msg: Message) => {
    setMessages((prev) => [...prev, msg]);
  };

  const simulateAIResponse = (userMessage: string) => {
    setIsTyping(true);
    const lower = userMessage.toLowerCase();
    let responseKey: string = 'default';
    if (lower.includes('schedule') || lower.includes('jadwal')) responseKey = 'schedule';
    else if (lower.includes('status') || lower.includes('down') || lower.includes('lag')) responseKey = 'status';
    else if (lower.includes('tutorial') || lower.includes('video') || lower.includes('learn')) responseKey = 'tutorials';
    else if (lower.includes('human') || lower.includes('agent') || lower.includes('person') || lower.includes('real')) responseKey = 'human';

    setTimeout(() => {
      setIsTyping(false);
      addMessage({
        role: 'ai',
        content: aiResponses[responseKey],
        actions: responseKey === 'default'
          ? undefined
          : [
              { label: 'Schedule an interview', action: 'schedule' },
              { label: 'Check platform status', action: 'status' },
              { label: 'View tutorials', action: 'tutorials' },
              { label: 'Talk to a human', action: 'human' },
            ],
      });
    }, 1000 + Math.random() * 800);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    addMessage({ role: 'user', content: input.trim() });
    setInput('');
    simulateAIResponse(input.trim());
  };

  const handleQuickAction = (label: string) => {
    addMessage({ role: 'user', content: label });
    setInput('');
    simulateAIResponse(label);
  };

  const handleActionClick = (action: string) => {
    const text = aiResponses[action] || aiResponses.default;
    addMessage({ role: 'user', content: text.split('\n')[0].replace(/^\d+\.\s*/, '') });
    simulateAIResponse(text);
  };

  const copyMessage = (content: string, index: number) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          AI Support Agent
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Get instant help — I know your role, your page, and how InterviewOS works
        </p>
      </div>

      <Card variant="ghost" padding="none" className="flex flex-col h-[580px]">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/[0.06] shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-on-dark" />
          </div>
          <div>
            <div className="text-[13px] font-medium text-white">AI Support</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-[10px] text-green-400/70">Online</span>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
            <Sparkles className="w-3 h-3 text-primary-on-dark" />
            <span className="text-[10px] font-mono text-body-muted/55">Context-aware</span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <AnimatePresence initial={false}>
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === 'ai'
                      ? 'bg-primary/10 border border-primary/20'
                      : 'bg-white/[0.04] border border-white/[0.06]'
                  }`}
                >
                  {msg.role === 'ai' ? (
                    <Bot className="w-3.5 h-3.5 text-primary-on-dark" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-body-muted/50" />
                  )}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                  <div
                    className={`rounded-lg px-4 py-2.5 text-[13px] leading-relaxed ${
                      msg.role === 'ai'
                        ? 'bg-surface-tile-1/40 border border-white/[0.06] text-body-muted/80'
                        : 'bg-primary/10 border border-primary/20 text-primary-on-dark'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.content}</div>
                  </div>

                  {/* Copy button */}
                  {msg.role === 'ai' && (
                    <button
                      onClick={() => copyMessage(msg.content, index)}
                      className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-body-muted/50 hover:text-body-muted/60 transition-colors"
                    >
                      {copiedIndex === index ? (
                        <Check className="w-3 h-3 text-green-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      {copiedIndex === index ? 'Copied' : 'Copy'}
                    </button>
                  )}

                  {/* Action buttons */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {msg.actions.map((action) => (
                        <button
                          key={action.action}
                          onClick={() => handleActionClick(action.action)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/[0.04] border border-white/[0.06] text-body-muted/60 hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-primary-on-dark" />
                </div>
                <div className="bg-surface-tile-1/40 border border-white/[0.06] rounded-lg px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-body-muted/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-body-muted/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-body-muted/30 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        <div className="px-5 py-2 border-t border-white/[0.06] shrink-0">
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => handleQuickAction(action.label)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white/[0.03] border border-white/[0.06] text-body-muted/50 hover:text-white hover:bg-white/[0.06] transition-colors"
                >
                  <Icon className="w-3 h-3" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input */}
        <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="flex-1 h-[38px] px-3.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-white text-[13px] placeholder:text-body-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send message"
              className="h-[38px] w-[38px] rounded-lg bg-primary hover:bg-primary-focus disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
