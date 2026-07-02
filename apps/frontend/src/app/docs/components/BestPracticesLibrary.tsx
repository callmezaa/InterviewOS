'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  MessageSquare,
  Shield,
  Zap,
  Users,
  BarChart3,
  Code2,
  Clock,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

interface Practice {
  icon: React.ElementType;
  title: string;
  category: string;
  description: string;
  tips: string[];
}

const practices: Practice[] = [
  {
    icon: MessageSquare,
    title: 'Structured Communication',
    category: 'Communication',
    description: 'Guide candidates through problems with structured communication techniques.',
    tips: [
      'Start with clarifying questions before jumping to solutions.',
      'Use the "think-aloud" method to understand candidate reasoning.',
      'Provide gentle nudges instead of direct answers when candidates are stuck.',
    ],
  },
  {
    icon: Shield,
    title: 'Bias-Free Interviewing',
    category: 'Fairness',
    description: 'Eliminate unconscious bias for fairer, more accurate evaluations.',
    tips: [
      'Use Blind Interview Mode to hide candidate identity during coding rounds.',
      'Score each candidate against predefined rubrics, not against each other.',
      'Rotate interview questions regularly to prevent answer leakage.',
    ],
  },
  {
    icon: Zap,
    title: 'Time-Efficient Evaluations',
    category: 'Efficiency',
    description: 'Get the most signal from every minute of interview time.',
    tips: [
      'Use the AI Copilot to track time and suggest follow-up questions.',
      'Reserve the last 5 minutes for candidate questions — it reveals priorities.',
      'Set clear time expectations at the start: "We have 45 minutes for 2 problems."',
    ],
  },
  {
    icon: Code2,
    title: 'Real-World Coding',
    category: 'Technical',
    description: 'Design coding challenges that mirror actual job responsibilities.',
    tips: [
      'Use the Collaborative IDE with real execution for authentic assessment.',
      'Include a small bug-fix exercise to test debugging skills.',
      'Allow candidates to use documentation — real engineers do.',
    ],
  },
  {
    icon: Users,
    title: 'Positive Candidate Experience',
    category: 'Experience',
    description: 'Leave every candidate impressed, regardless of outcome.',
    tips: [
      'Start with a warm introduction and explain the interview structure.',
      'Share the AI feedback report with all candidates, not just hires.',
      'Send personalized rejection videos to maintain your employer brand.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Data-Driven Hiring',
    category: 'Analytics',
    description: 'Use interview data to continuously improve your hiring process.',
    tips: [
      'Review the AI scoring trends dashboard weekly to spot calibration drift.',
      'Compare interview scores with probation performance to validate accuracy.',
      'Build talent pools from all candidates — past applicants are future hires.',
    ],
  },
  {
    icon: Lightbulb,
    title: 'System Design Interviews',
    category: 'Technical',
    description: 'Structure system design rounds for maximum insight.',
    tips: [
      'Use the Whiteboard for architecture diagrams — the auto-beautify AI helps.',
      'Focus on trade-offs: "Why this database over others?" reveals depth.',
      'Evaluate communication of complex ideas, not just the final design.',
    ],
  },
  {
    icon: Clock,
    title: 'Interview Prep Playbook',
    category: 'Preparation',
    description: 'Prepare effectively before every interview session.',
    tips: [
      'Review the candidate\'s resume and any previous interview notes in the system.',
      'Pre-configure the coding environment with relevant challenges.',
      'Test your audio/video equipment 5 minutes before the scheduled time.',
    ],
  },
];

const categories = Array.from(new Set(practices.map((p) => p.category)));

const fadeSlideUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

interface BestPracticesLibraryProps {
  searchQuery: string;
}

export function BestPracticesLibrary({ searchQuery }: BestPracticesLibraryProps) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const filtered = practices.filter((p) => {
    const matchesCategory = !activeCategory || p.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tips.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          Best Practices
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Proven techniques from top engineering organizations
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
            !activeCategory
              ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
              : 'bg-white/[0.04] text-body-muted/50 hover:text-white border border-transparent hover:border-white/[0.12]'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-primary/10 text-primary-on-dark border border-primary/20'
                : 'bg-white/[0.04] text-body-muted/50 hover:text-white border border-transparent hover:border-white/[0.12]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((practice, index) => {
            const Icon = practice.icon;
            return (
              <motion.div
                key={practice.title}
                variants={fadeSlideUp}
                initial="initial"
                animate="animate"
                transition={{ delay: index * 0.04 }}
              >
                <Card variant="interactive" padding="md" className="h-full group">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-4 h-4 text-primary-on-dark" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[14px] font-semibold text-white">{practice.title}</h3>
                        <span className="text-[9px] font-mono font-semibold text-body-muted/50 bg-white/[0.03] px-1.5 py-0.5 rounded shrink-0">
                          {practice.category}
                        </span>
                      </div>
                      <p className="text-[12px] text-body-muted/50 mt-1 leading-relaxed">
                        {practice.description}
                      </p>
                      <ul className="mt-3 space-y-1.5">
                        {practice.tips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-2 text-[11px] text-body-muted/55 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-primary/40 mt-1.5 shrink-0" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card variant="default" padding="lg" className="text-center">
          <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mx-auto">
            <Lightbulb className="w-6 h-6 text-body-muted/50" />
          </div>
          <p className="text-[13px] text-body-muted/50 mt-3">No practices match your search</p>
          <Button variant="ghost" onClick={() => {}} className="mt-3 text-[12px]">
            Clear filters
          </Button>
        </Card>
      )}
    </motion.div>
  );
}
