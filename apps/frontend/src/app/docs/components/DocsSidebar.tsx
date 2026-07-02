'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen, Puzzle, History } from 'lucide-react';
import type { DocSection } from '../DocsPage';

const sections: { id: DocSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'getting-started', label: 'Getting Started', icon: Sparkles, description: 'Setup your first interview in minutes' },
  { id: 'best-practices', label: 'Best Practices', icon: BookOpen, description: 'Tips from power users' },
  { id: 'integrations', label: 'Integrations', icon: Puzzle, description: 'Connect your tools' },
  { id: 'changelog', label: 'Changelog', icon: History, description: 'Latest updates & releases' },
];

interface DocsSidebarProps {
  activeSection: DocSection;
  onNavigate: (section: DocSection) => void;
}

export function DocsSidebar({ activeSection, onNavigate }: DocsSidebarProps) {
  return (
    <aside className="w-full lg:w-[220px] shrink-0">
      <nav className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {sections.map((section) => {
          const Icon = section.icon;
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 shrink-0 w-auto lg:w-full ${
                isActive
                  ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 rounded-lg bg-primary/10 border border-primary/20"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className={`w-4 h-4 relative z-10 ${isActive ? 'text-primary' : ''}`} />
              <div className="relative z-10 min-w-0">
                <div className="text-[13px] font-medium truncate">{section.label}</div>
                <div className="text-[10px] text-body-muted/50 truncate hidden lg:block">
                  {section.description}
                </div>
              </div>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
