import {
  LayoutDashboard, Settings, Plus, List, RotateCw,
  Keyboard, Sparkles, Award, Bug,
  Mic, Video, Monitor, Play, Terminal, Code, Palette,
  MessageSquare, Cpu, Shield, LogOut, Radio, Beaker,
  User, Globe, Bell, Save, FileText, HelpCircle,
  IndentIncrease,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type CommandContext = 'global' | 'dashboard' | 'settings' | 'interview' | 'auth';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  category: string;
  shortcut?: string;
  keywords: string[];
  context: CommandContext[];
  interviewerOnly?: boolean;
}

function cmd(a: CommandAction): CommandAction {
  return a;
}

export const COMMANDS: CommandAction[] = [
  // ── Navigation ──────────────────────────────────────
  cmd({
    id: 'navigate-dashboard',
    label: 'Dashboard',
    description: 'Go to the main dashboard',
    icon: LayoutDashboard,
    category: 'Navigation',
    shortcut: 'G D',
    keywords: ['dashboard', 'home', 'main'],
    context: ['global'],
  }),
  cmd({
    id: 'navigate-settings',
    label: 'Settings',
    description: 'Account settings and preferences',
    icon: Settings,
    category: 'Navigation',
    shortcut: 'G S',
    keywords: ['settings', 'preferences', 'config'],
    context: ['global'],
  }),
  cmd({
    id: 'navigate-docs',
    label: 'Documentation',
    description: 'Browse documentation, guides, and changelog',
    icon: FileText,
    category: 'Navigation',
    keywords: ['docs', 'documentation', 'guides', 'help'],
    context: ['global'],
  }),
  cmd({
    id: 'navigate-support',
    label: 'Help & Support',
    description: 'Get help via AI agent, status page, tutorials, or community',
    icon: HelpCircle,
    category: 'Navigation',
    keywords: ['support', 'help', 'chat', 'status', 'tutorial', 'community'],
    context: ['global'],
  }),

  // ── Actions ─────────────────────────────────────────
  cmd({
    id: 'schedule-interview',
    label: 'Schedule New Interview',
    description: 'Create and schedule a new interview session',
    icon: Plus,
    category: 'Actions',
    shortcut: 'C I',
    keywords: ['schedule', 'create', 'interview', 'new'],
    context: ['global'],
  }),
  cmd({
    id: 'toggle-view',
    label: 'Switch View (List/Calendar)',
    description: 'Switch between list and calendar view on dashboard',
    icon: List,
    category: 'Actions',
    keywords: ['view', 'list', 'calendar', 'toggle'],
    context: ['dashboard'],
  }),
  cmd({
    id: 'refresh-interviews',
    label: 'Refresh Interview List',
    description: 'Reload the interview list from server',
    icon: RotateCw,
    category: 'Actions',
    keywords: ['refresh', 'reload', 'sync'],
    context: ['dashboard'],
  }),

  // ── Help ─────────────────────────────────────────────
  cmd({
    id: 'toggle-shortcuts',
    label: 'Keyboard Shortcuts',
    description: 'View all available keyboard shortcuts',
    icon: Keyboard,
    category: 'Help',
    shortcut: '?',
    keywords: ['shortcuts', 'keyboard', 'keys', 'help'],
    context: ['global'],
  }),
  cmd({
    id: 'open-tour',
    label: 'Interactive Tour',
    description: 'Restart the guided onboarding tour',
    icon: Sparkles,
    category: 'Help',
    keywords: ['tour', 'onboarding', 'guide', 'help', 'tutorial'],
    context: ['global'],
  }),
  cmd({
    id: 'about-interviewos',
    label: 'About InterviewOS',
    description: 'Version, team, and platform information',
    icon: Award,
    category: 'Help',
    keywords: ['about', 'version', 'info', 'team'],
    context: ['global'],
  }),
  cmd({
    id: 'report-issue',
    label: 'Report Issue',
    description: 'Open GitHub issues to report a bug or suggest a feature',
    icon: Bug,
    category: 'Help',
    keywords: ['report', 'issue', 'bug', 'feedback'],
    context: ['global'],
  }),

  // ── Interview Room ──────────────────────────────────
  cmd({
    id: 'toggle-mic',
    label: 'Mute / Unmute Microphone',
    icon: Mic,
    category: 'Interview Room',
    shortcut: 'M',
    keywords: ['mic', 'microphone', 'audio', 'mute', 'toggle'],
    context: ['interview'],
  }),
  cmd({
    id: 'toggle-camera',
    label: 'Disable / Enable Camera',
    icon: Video,
    category: 'Interview Room',
    keywords: ['camera', 'video', 'mute', 'toggle'],
    context: ['interview'],
  }),
  cmd({
    id: 'toggle-screenshare',
    label: 'Share / Stop Screen',
    icon: Monitor,
    category: 'Interview Room',
    keywords: ['screen', 'share', 'screenshare', 'present'],
    context: ['interview'],
  }),
  cmd({
    id: 'format-code',
    label: 'Format Code',
    description: 'Format code with Prettier',
    icon: IndentIncrease,
    category: 'Interview Room',
    shortcut: '\u21E7\u2325F',
    keywords: ['format', 'prettier', 'beautify', 'clean', 'indent'],
    context: ['interview'],
  }),
  cmd({
    id: 'run-code',
    label: 'Run Code',
    icon: Play,
    category: 'Interview Room',
    shortcut: '\u2318\u21B5',
    keywords: ['run', 'code', 'execute'],
    context: ['interview'],
  }),
  cmd({
    id: 'toggle-console',
    label: 'Open / Close Console',
    icon: Terminal,
    category: 'Interview Room',
    keywords: ['console', 'terminal', 'output', 'toggle'],
    context: ['interview'],
  }),
  cmd({
    id: 'switch-editor',
    label: 'Switch to Code Editor',
    icon: Code,
    category: 'Interview Room',
    keywords: ['editor', 'code', 'switch'],
    context: ['interview'],
  }),
  cmd({
    id: 'run-tests',
    label: 'Run Test Cases',
    icon: Beaker,
    category: 'Interview Room',
    shortcut: '\u2318\u21B5',
    keywords: ['test', 'case', 'run', 'assert', 'unit'],
    context: ['interview'],
  }),
  cmd({
    id: 'switch-tests',
    label: 'Switch to Test Cases',
    icon: Beaker,
    category: 'Interview Room',
    keywords: ['test', 'case', 'switch', 'tab'],
    context: ['interview'],
  }),
  cmd({
    id: 'switch-whiteboard',
    label: 'Switch to Whiteboard',
    icon: Palette,
    category: 'Interview Room',
    keywords: ['whiteboard', 'draw', 'switch'],
    context: ['interview'],
  }),
  cmd({
    id: 'open-transcript',
    label: 'Open Transcript',
    icon: MessageSquare,
    category: 'Interview Room',
    keywords: ['transcript', 'text'],
    context: ['interview'],
  }),
  cmd({
    id: 'open-chat',
    label: 'Open Chat',
    icon: MessageSquare,
    category: 'Interview Room',
    keywords: ['chat', 'message', 'talk'],
    context: ['interview'],
  }),
  cmd({
    id: 'open-ai-challenge',
    label: 'AI Challenge Generator',
    icon: Sparkles,
    category: 'Interview Room',
    keywords: ['ai', 'challenge', 'generator', 'question'],
    context: ['interview'],
    interviewerOnly: true,
  }),
  cmd({
    id: 'open-copilot',
    label: 'Open AI Copilot',
    icon: Cpu,
    category: 'Interview Room',
    keywords: ['ai', 'copilot', 'assistant', 'suggestion'],
    context: ['interview'],
    interviewerOnly: true,
  }),
  cmd({
    id: 'open-proctoring',
    label: 'Open Proctoring Log',
    icon: Shield,
    category: 'Interview Room',
    keywords: ['proctoring', 'log', 'monitor', 'security'],
    context: ['interview'],
    interviewerOnly: true,
  }),
  cmd({
    id: 'toggle-recording',
    label: 'Start / Stop Recording',
    icon: Radio,
    category: 'Interview Room',
    keywords: ['record', 'recording', 'start', 'stop'],
    context: ['interview'],
    interviewerOnly: true,
  }),
  cmd({
    id: 'evaluate-session',
    label: 'Evaluate Session',
    icon: Award,
    category: 'Interview Room',
    keywords: ['evaluate', 'score', 'feedback', 'review'],
    context: ['interview'],
    interviewerOnly: true,
  }),
  cmd({
    id: 'exit-room',
    label: 'Leave Room',
    icon: LogOut,
    category: 'Interview Room',
    keywords: ['exit', 'leave', 'quit', 'close'],
    context: ['interview'],
  }),
  cmd({
    id: 'room-tour',
    label: 'Room Tour',
    description: 'Restart the interview room guided tour',
    icon: Sparkles,
    category: 'Interview Room',
    keywords: ['tour', 'onboarding', 'guide', 'walkthrough', 'help'],
    context: ['interview'],
  }),

  // ── Settings ─────────────────────────────────────────
  cmd({
    id: 'settings-profile',
    label: 'Edit Profile',
    icon: User,
    category: 'Settings',
    keywords: ['profile', 'edit', 'name', 'email'],
    context: ['settings'],
  }),
  cmd({
    id: 'settings-language',
    label: 'Language Preferences',
    icon: Globe,
    category: 'Settings',
    keywords: ['language', 'preferences', 'default', 'coding'],
    context: ['settings'],
  }),
  cmd({
    id: 'settings-notifications',
    label: 'Notifications',
    icon: Bell,
    category: 'Settings',
    keywords: ['notifications', 'email', 'alert'],
    context: ['settings'],
  }),
  cmd({
    id: 'save-settings',
    label: 'Save Settings',
    icon: Save,
    category: 'Settings',
    keywords: ['save', 'settings'],
    context: ['settings'],
  }),
];

export function getCommandsForContext(
  context: CommandContext,
  isInterviewer: boolean,
  searchQuery?: string,
): { category: string; commands: CommandAction[] }[] {
  const q = searchQuery?.toLowerCase().trim() ?? '';
  const filtered = COMMANDS.filter((cmd) => {
    if (!cmd.context.includes(context) && !cmd.context.includes('global')) return false;
    if (cmd.interviewerOnly && !isInterviewer) return false;
    if (!q) return true;
    return (
      cmd.label.toLowerCase().includes(q) ||
      (cmd.description ?? '').toLowerCase().includes(q) ||
      cmd.keywords.some((k) => k.toLowerCase().includes(q))
    );
  });

  if (!filtered.length) return [];

  const grouped = new Map<string, CommandAction[]>();
  for (const cmd of filtered) {
    const list = grouped.get(cmd.category) ?? [];
    list.push(cmd);
    grouped.set(cmd.category, list);
  }

  return Array.from(grouped.entries()).map(([category, commands]) => ({
    category,
    commands,
  }));
}

export const SHORTCUT_HINT_CLASS =
  'ml-auto text-[10px] font-mono text-white/25 tracking-tight px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06]';
