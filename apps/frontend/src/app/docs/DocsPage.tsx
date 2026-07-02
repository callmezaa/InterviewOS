'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Sparkles, Copy, Check } from 'lucide-react';
import { DocsSidebar } from './components/DocsSidebar';
import { DocSearch } from './components/DocSearch';
import { GettingStartedPlaybook } from './components/GettingStartedPlaybook';
import { BestPracticesLibrary } from './components/BestPracticesLibrary';
import { Changelog } from './components/Changelog';
import { IntegrationGuides } from './components/IntegrationGuides';

export type DocSection = 'getting-started' | 'best-practices' | 'integrations' | 'changelog';

const sectionMeta: Record<DocSection, { label: string; icon: React.ElementType }> = {
  'getting-started': { label: 'Getting Started', icon: Sparkles },
  'best-practices': { label: 'Best Practices', icon: BookOpen },
  integrations: { label: 'Integrations', icon: BookOpen },
  changelog: { label: 'Changelog', icon: BookOpen },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.06 },
  },
};

const fadeSlideUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
};

export function DocsPage() {
  const [activeSection, setActiveSection] = useState<DocSection>('getting-started');
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = useCallback((section: DocSection) => {
    setActiveSection(section);
    setSearchQuery('');
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'getting-started':
        return <GettingStartedPlaybook />;
      case 'best-practices':
        return <BestPracticesLibrary searchQuery={searchQuery} />;
      case 'integrations':
        return <IntegrationGuides />;
      case 'changelog':
        return <Changelog />;
    }
  };

  return (
    <main className="min-h-[calc(100vh-96px)]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-12">
        {/* Search bar */}
        <DocSearch
          value={searchQuery}
          onChange={handleSearch}
          activeSection={activeSection}
          onNavigate={handleNavigate}
        />

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 mt-6">
          {/* Sidebar */}
          <DocsSidebar
            activeSection={activeSection}
            onNavigate={handleNavigate}
          />

          {/* Main content */}
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
