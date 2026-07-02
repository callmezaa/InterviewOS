'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Activity, Video, Shield, Users } from 'lucide-react';
import type { SupportSection } from '../SupportPage';

const sections: { id: SupportSection; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'ai-agent', label: 'AI Support Agent', icon: MessageSquare, description: 'Get instant help from our AI assistant' },
  { id: 'system-status', label: 'System Status', icon: Activity, description: 'Real-time platform health monitoring' },
  { id: 'video-kb', label: 'Video Tutorials', icon: Video, description: 'Short walkthroughs for every feature' },
  { id: 'priority', label: 'Support Tiers', icon: Shield, description: 'Priority support & SLAs' },
  { id: 'community', label: 'Community Hub', icon: Users, description: 'Connect with other interviewers' },
];

interface SupportSidebarProps {
  activeSection: SupportSection;
  onNavigate: (section: SupportSection) => void;
}

export function SupportSidebar({ activeSection, onNavigate }: SupportSidebarProps) {
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
                  layoutId="support-sidebar-active"
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
