'use client';

import React, { useRef, useEffect } from 'react';
import { Search, MessageSquare, Activity, Video, Shield, Users } from 'lucide-react';
import type { SupportSection } from '../SupportPage';

interface SupportSearchProps {
  value: string;
  onChange: (query: string) => void;
  activeSection: SupportSection;
  onNavigate: (section: SupportSection) => void;
}

const searchHints: { query: string; section: SupportSection; label: string }[] = [
  { query: 'chat', section: 'ai-agent', label: 'AI Chat Support' },
  { query: 'talk to agent', section: 'ai-agent', label: 'Talk to Support Agent' },
  { query: 'help', section: 'ai-agent', label: 'Get Help' },
  { query: 'status', section: 'system-status', label: 'System Status' },
  { query: 'downtime', section: 'system-status', label: 'Service Downtime' },
  { query: 'video', section: 'video-kb', label: 'Video Tutorials' },
  { query: 'tutorial', section: 'video-kb', label: 'How-to Guides' },
  { query: 'tiers', section: 'priority', label: 'Support Tiers' },
  { query: 'enterprise', section: 'priority', label: 'Enterprise Support' },
  { query: 'community', section: 'community', label: 'Community Forum' },
  { query: 'tips', section: 'community', label: 'Interviewer Tips' },
];

const sectionIcon: Record<SupportSection, React.ElementType> = {
  'ai-agent': MessageSquare,
  'system-status': Activity,
  'video-kb': Video,
  priority: Shield,
  community: Users,
};

export function SupportSearch({ value, onChange, activeSection, onNavigate }: SupportSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focusedIndex, setFocusedIndex] = React.useState(-1);

  const filteredHints = value.trim()
    ? searchHints.filter(
        (h) =>
          h.query.includes(value.toLowerCase()) || h.label.toLowerCase().includes(value.toLowerCase()),
      )
    : [];

  useEffect(() => {
    setFocusedIndex(-1);
  }, [value]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        const active = document.activeElement;
        if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }
      if (filteredHints.length > 0 && document.activeElement === inputRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, filteredHints.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && focusedIndex >= 0) {
          e.preventDefault();
          const hint = filteredHints[focusedIndex];
          onNavigate(hint.section);
          onChange('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredHints, focusedIndex, onNavigate, onChange]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted/55 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="How can we help you?"
          className="w-full h-12 pl-11 pr-4 rounded-lg bg-surface-tile-1/40 border border-white/[0.06] text-white text-[14px] placeholder:text-body-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary/40 focus:bg-surface-tile-1/60 transition-all duration-200"
          aria-label="Search support articles"
        />
        <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-body-muted/50">
          <span className="text-[9px]">/</span>
        </kbd>
      </div>

      {filteredHints.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-lg bg-surface-tile-2/95 backdrop-blur-xl border border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden z-50">
          {filteredHints.slice(0, 6).map((hint, index) => {
            const Icon = sectionIcon[hint.section];
            const isSelected = index === focusedIndex;
            return (
              <button
                key={hint.query + hint.section}
                onClick={() => {
                  onNavigate(hint.section);
                  onChange('');
                }}
                onMouseEnter={() => setFocusedIndex(index)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[13px] transition-colors duration-150 ${
                  isSelected
                    ? 'bg-primary/10 text-primary-on-dark'
                    : 'text-body-muted/70 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{hint.label}</span>
                <span className="text-[10px] text-body-muted/20 font-mono">
                  Go to {hint.section}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
