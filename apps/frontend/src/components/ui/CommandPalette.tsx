'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useInterviewStore } from '../../store/useInterviewStore';
import { useCommandPalette } from '../../store/useCommandPaletteStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandGroup,
  CommandEmpty,
} from 'cmdk';
import {
  LayoutDashboard,
  Settings,
  Mic, Video, Monitor, Play, Terminal, Code, Palette,
  MessageSquare, Cpu, Shield, LogOut, Radio, Award, Sparkles,
  Search, Plus, RotateCw, List, User, Bell, Globe, Save,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';
import { getCommandsForContext, SHORTCUT_HINT_CLASS } from '../../lib/commands';
import type { CommandContext, CommandAction } from '../../lib/commands';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Navigation: LayoutDashboard,
  Actions: Plus,
  Help: HelpCircle,
  'Interview Room': Terminal,
  Settings: Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
  Navigation: 'text-blue-400',
  Actions: 'text-emerald-400',
  Help: 'text-amber-400',
  'Interview Room': 'text-purple-400',
  Settings: 'text-sky-400',
};

function shortcutLabel(s?: string): string | null {
  if (!s) return null;
  const map: Record<string, string> = {
    'G D': 'G  D',
    'G S': 'G  S',
    'C I': 'C  I',
    '?': '?',
    'M': 'M',
  };
  return map[s] ?? s;
}

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;
  const q = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${q})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-white font-medium">{part}</span>
        ) : (
          <span key={i} className="text-white/70">{part}</span>
        ),
      )}
    </>
  );
}

export const CommandPalette: React.FC = () => {
  const { open, setOpen } = useCommandPalette();
  const router = useRouter();
  const pathname = usePathname();
  const user = useInterviewStore((s) => s.user);
  const isInterviewer = user?.role === 'INTERVIEWER';
  const [query, setQuery] = React.useState('');

  const context: CommandContext = pathname.startsWith('/interview/')
    ? 'interview'
    : pathname.startsWith('/settings')
      ? 'settings'
      : pathname.startsWith('/auth')
        ? 'auth'
        : 'dashboard';

  const groups = getCommandsForContext(context, isInterviewer, query);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, [setOpen]);

  const handleSelect = useCallback((cmd: CommandAction) => {
    close();

    switch (cmd.id) {
      // ── Navigation ─────────────────────────
      case 'navigate-dashboard':
        router.push('/dashboard');
        return;
      case 'navigate-settings':
        router.push('/settings');
        return;
      case 'navigate-docs':
        router.push('/docs');
        return;
      case 'navigate-support':
        router.push('/support');
        return;

      // ── Help ───────────────────────────────
      case 'toggle-shortcuts':
        window.dispatchEvent(new Event('shortcuts:toggle'));
        return;
      case 'open-tour':
        if (typeof window !== 'undefined') {
          localStorage.removeItem('tour_complete');
          localStorage.removeItem('onboarding_complete');
        }
        router.push('/dashboard');
        return;
      case 'room-tour':
        if (typeof window !== 'undefined') {
          localStorage.removeItem('room_tour_interviewer_done');
          localStorage.removeItem('room_tour_candidate_done');
        }
        window.dispatchEvent(new Event('room-tour:restart'));
        return;
      case 'about-interviewos':
        window.dispatchEvent(new CustomEvent('cmdk:action', { detail: 'about-interviewos' }));
        return;
      case 'report-issue':
        window.open('https://github.com/anomalyco/InterviewOS/issues/new', '_blank', 'noopener,noreferrer');
        return;

      // ── Dashboard actions ──────────────────
      case 'schedule-interview':
        if (pathname === '/dashboard') {
          window.dispatchEvent(new CustomEvent('cmdk:action', { detail: 'schedule-interview' }));
        } else {
          router.push('/dashboard');
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('cmdk:action', { detail: 'schedule-interview' }));
          }, 300);
        }
        return;
      case 'toggle-view':
      case 'refresh-interviews':
        window.dispatchEvent(new CustomEvent('cmdk:action', { detail: cmd.id }));
        return;

      // ── Interview Room ─────────────────────
      case 'exit-room':
        router.push('/dashboard');
        return;

      case 'toggle-mic':
      case 'toggle-camera':
      case 'toggle-screenshare':
      case 'run-code':
      case 'toggle-console':
      case 'switch-editor':
      case 'switch-whiteboard':
      case 'open-transcript':
      case 'open-chat':
      case 'open-ai-challenge':
      case 'open-copilot':
      case 'open-proctoring':
      case 'toggle-recording':
      case 'evaluate-session':
        window.dispatchEvent(new CustomEvent('cmdk:action', { detail: cmd.id }));
        return;

      // ── Settings ───────────────────────────
      case 'settings-profile':
      case 'settings-language':
      case 'settings-notifications':
      case 'save-settings':
        window.dispatchEvent(new CustomEvent('cmdk:action', { detail: cmd.id }));
        return;

      default:
        return;
    }
  }, [close, router, pathname]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, setOpen]);

  const iconColor = (cmd: CommandAction) => {
    if (cmd.id === 'exit-room') return 'text-red-400';
    if (cmd.id === 'open-ai-challenge') return 'text-primary';
    if (cmd.id === 'open-proctoring') return 'text-red-400';
    return 'text-white/55';
  };

  const rowClass = (cmd: CommandAction) => {
    const base = 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] cursor-pointer transition-colors';
    if (cmd.id === 'exit-room') return `${base} text-red-400 data-[selected=true]:bg-red-500/10`;
    return `${base} text-white/80 data-[selected=true]:bg-white/[0.06]`;
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setOpen(false); setQuery(''); }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[580px] bg-surface-tile-2/95 backdrop-blur-xl border border-white/[0.06] rounded-lg shadow-[var(--shadow-dropdown)] overflow-hidden"
          >
            <Command label="Command Palette" shouldFilter={false} autoFocus className="flex flex-col">
              <div className="flex items-center gap-3 px-4 border-b border-white/[0.06]">
                <Search className="w-4 h-4 text-white/50 shrink-0" />
                <CommandInput
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search commands, type an action..."
                  className="w-full bg-transparent text-[14px] text-white/90 placeholder-white/30 py-3.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
                />
              </div>

              <CommandList className="max-h-[400px] overflow-y-auto p-2">
                <CommandEmpty className="py-8 text-center text-[13px] text-white/50">
                  No results for &ldquo;{query}&rdquo;
                </CommandEmpty>

                {!query && context !== 'interview' && (
                  <div className="px-3 py-2 mb-1">
                    <p className="text-[11px] text-white/20 text-center">
                      Press <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/55 bg-white/[0.06] border border-white/[0.06] rounded">↑</kbd><kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/55 bg-white/[0.06] border border-white/[0.06] rounded ml-0.5">↓</kbd> to navigate, <kbd className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-white/55 bg-white/[0.06] border border-white/[0.06] rounded">↵</kbd> to select
                    </p>
                  </div>
                )}

                {groups.map((group) => {
                  const CatIcon = CATEGORY_ICONS[group.category];
                  const catColor = CATEGORY_COLORS[group.category] ?? 'text-white/55';
                  return (
                    <CommandGroup key={group.category} heading={
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-white/50 px-1 py-1">
                        {CatIcon && <CatIcon className={`w-3 h-3 ${catColor}`} />}
                        {group.category}
                      </span>
                    }>
                      {group.commands.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <CommandItem
                            key={cmd.id}
                            value={`${cmd.category} ${cmd.label} ${cmd.keywords.join(' ')}`}
                            onSelect={() => handleSelect(cmd)}
                            className={rowClass(cmd)}
                          >
                            <Icon className={`w-4 h-4 ${iconColor(cmd)} shrink-0`} />
                            <span className="truncate">
                              {highlightText(cmd.label, query)}
                            </span>
                            {cmd.shortcut && query.length < 2 && (
                              <span className={SHORTCUT_HINT_CLASS}>
                                {shortcutLabel(cmd.shortcut)}
                              </span>
                            )}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  );
                })}

                {!query && (
                  <div className="px-3 py-2.5 mt-1 border-t border-white/[0.06]">
                    <p className="text-[10px] text-white/15 text-center">
                      <kbd className="inline-flex items-center px-1 py-0.5 text-[9px] font-mono text-white/50 bg-white/[0.05] border border-white/[0.06] rounded">⌘K</kbd> close &middot; <kbd className="inline-flex items-center px-1 py-0.5 text-[9px] font-mono text-white/50 bg-white/[0.05] border border-white/[0.06] rounded">?</kbd> shortcuts
                    </p>
                  </div>
                )}
              </CommandList>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
