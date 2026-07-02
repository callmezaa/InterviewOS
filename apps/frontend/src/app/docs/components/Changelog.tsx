'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  History,
  Sparkles,
  Bug,
  Zap,
  Shield,
  Puzzle,
  Code2,
  Monitor,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface Release {
  version: string;
  date: string;
  title: string;
  changes: { type: 'feature' | 'improvement' | 'fix'; icon: React.ElementType; text: string }[];
}

const releases: Release[] = [
  {
    version: 'v2.4.0',
    date: 'June 2026',
    title: 'AI Copilot & Adaptive Interviews',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'AI Copilot provides real-time suggestions during interviews' },
      { type: 'feature', icon: Zap, text: 'Adaptive Interview Engine adjusts difficulty based on candidate performance' },
      { type: 'improvement', icon: Puzzle, text: 'Redesigned command palette with 28 actions across 5 categories' },
      { type: 'improvement', icon: Code2, text: 'Full keyboard shortcut system with 28 shortcuts across 4 scopes' },
      { type: 'fix', icon: Bug, text: 'Fixed video grid layout issue on ultra-wide monitors' },
    ],
  },
  {
    version: 'v2.3.0',
    date: 'May 2026',
    title: 'Interactive Playbook & Docs Hub',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Interactive Getting Started Playbook with progress tracking' },
      { type: 'feature', icon: Monitor, text: 'New Documentation Hub with search and best practices library' },
      { type: 'improvement', icon: Shield, text: 'Enhanced ErrorBoundary wrapping for better crash recovery' },
      { type: 'improvement', icon: Code2, text: 'Unified card system with 6 variants and 4 padding levels' },
      { type: 'fix', icon: Bug, text: 'Fixed mobile calendar overflow on small screens' },
    ],
  },
  {
    version: 'v2.2.0',
    date: 'April 2026',
    title: 'Post-Interview Review & AI Feedback',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Post-interview review page at /review/[id] with AI scoring' },
      { type: 'feature', icon: Monitor, text: 'AIInsightsWidget showing score trends and distribution on dashboard' },
      { type: 'improvement', icon: Puzzle, text: '3-panel interview room layout with collapsible right panel' },
      { type: 'improvement', icon: Code2, text: 'Micro-animations across all interactive elements' },
    ],
  },
  {
    version: 'v2.1.0',
    date: 'March 2026',
    title: 'Design System Overhaul',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Tailwind v4 migration with custom @theme design tokens' },
      { type: 'feature', icon: Monitor, text: 'Design token enforcement via ESLint custom rule' },
      { type: 'improvement', icon: Shield, text: 'Spacing standardization: all p-4 replaced with p-4' },
      { type: 'improvement', icon: Code2, text: 'Border radius audit: all rounded-xl → rounded-lg (18px)' },
      { type: 'fix', icon: Bug, text: 'Color consistency fixes across landing pages and interview room' },
    ],
  },
  {
    version: 'v2.0.0',
    date: 'February 2026',
    title: 'Guided Tour & Confirm Dialogs',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'Interactive Guided Tour with spotlight overlay and tooltips' },
      { type: 'feature', icon: Puzzle, text: 'Reusable ConfirmDialog with 3 variants (danger/warning/info)' },
      { type: 'improvement', icon: Shield, text: 'Per-route error pages with illustrations and retry actions' },
      { type: 'improvement', icon: Code2, text: 'Loading skeletons for all major pages' },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'January 2026',
    title: 'Initial Release',
    changes: [
      { type: 'feature', icon: Sparkles, text: 'WebRTC video calls with real-time peer-to-peer connection' },
      { type: 'feature', icon: Monitor, text: 'Collaborative code editor with synchronized keystrokes' },
      { type: 'feature', icon: Code2, text: 'Interactive whiteboard for system design discussions' },
      { type: 'feature', icon: Puzzle, text: 'AI-powered transcription via Whisper speech-to-text' },
      { type: 'feature', icon: Shield, text: 'Proctoring panel with browser focus and activity monitoring' },
    ],
  },
];

const typeVariants = {
  feature: 'primary' as const,
  improvement: 'warning' as const,
  fix: 'success' as const,
};

const typeLabels = {
  feature: 'New',
  improvement: 'Improved',
  fix: 'Fixed',
};

export function Changelog() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          Changelog
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Every update that makes InterviewOS better
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-[19px] top-0 bottom-0 w-px bg-white/[0.04]" />

        <div className="space-y-8">
          {releases.map((release, index) => (
            <motion.div
              key={release.version}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="relative pl-12"
            >
              {/* Timeline dot */}
              <div className="absolute left-[14px] top-1.5 w-[11px] h-[11px] rounded-full bg-primary border-[3px] border-surface-black" />

              <Card variant="default" padding="md">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[15px] font-display font-semibold text-white tracking-tight">
                    {release.version}
                  </span>
                  <span className="text-[10px] font-mono text-body-muted/50 bg-white/[0.03] px-2 py-0.5 rounded">
                    {release.date}
                  </span>
                </div>
                <h3 className="text-[13px] font-medium text-body-muted/80 mb-3">{release.title}</h3>
                <ul className="space-y-2">
                  {release.changes.map((change, ci) => {
                    const Icon = change.icon;
                    return (
                      <li key={ci} className="flex items-start gap-2.5 text-[12px] text-body-muted/50 leading-relaxed">
                        <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-body-muted/50" />
                        <span className="flex-1">{change.text}</span>
                        <Badge size="sm" variant={typeVariants[change.type]}>{typeLabels[change.type]}</Badge>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
