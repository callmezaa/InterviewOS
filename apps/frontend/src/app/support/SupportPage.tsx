'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Activity, Video, Shield, Users } from 'lucide-react';
import { SupportSidebar } from './components/SupportSidebar';
import { SupportSearch } from './components/SupportSearch';
import { AISupportAgent } from './components/AISupportAgent';
import { SystemStatus } from './components/SystemStatus';
import { VideoKnowledgeBase } from './components/VideoKnowledgeBase';
import { SupportTiers } from './components/SupportTiers';
import { CommunityHub } from './components/CommunityHub';

export type SupportSection = 'ai-agent' | 'system-status' | 'video-kb' | 'priority' | 'community';

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
};

export function SupportPage() {
  const [activeSection, setActiveSection] = useState<SupportSection>('ai-agent');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = useCallback((section: SupportSection) => {
    setActiveSection(section);
    setSearchQuery('');
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'ai-agent':
        return <AISupportAgent />;
      case 'system-status':
        return <SystemStatus />;
      case 'video-kb':
        return <VideoKnowledgeBase searchQuery={searchQuery} />;
      case 'priority':
        return <SupportTiers />;
      case 'community':
        return <CommunityHub />;
    }
  };

  return (
    <main className="min-h-[calc(100vh-96px)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12">
        <SupportSearch
          value={searchQuery}
          onChange={setSearchQuery}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-6">
          <SupportSidebar activeSection={activeSection} onNavigate={handleNavigate} />

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                variants={stagger}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
