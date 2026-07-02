'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, Sparkles, Calendar, Monitor, Users, FileText, BarChart3, Code2, MessageSquare, Shield } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface Video {
  icon: React.ElementType;
  title: string;
  description: string;
  duration: string;
  category: string;
}

const videos: Video[] = [
  { icon: Sparkles, title: 'Getting Started with InterviewOS', description: 'Set up your account and schedule your first interview in under 5 minutes.', duration: '4:32', category: 'Basics' },
  { icon: Calendar, title: 'Scheduling & Invitations', description: 'Master the scheduling form, calendar sync, and automated candidate invites.', duration: '3:15', category: 'Basics' },
  { icon: Monitor, title: 'Navigating the Interview Room', description: 'Tour the 3-panel layout: video, code editor, whiteboard, and collapsible panel.', duration: '5:00', category: 'Interviewing' },
  { icon: Code2, title: 'Live Coding with Real Execution', description: 'Write, run, and debug code with the collaborative IDE during interviews.', duration: '6:20', category: 'Interviewing' },
  { icon: MessageSquare, title: 'Using AI Copilot Effectively', description: 'Get real-time suggestions and time management tips from your AI assistant.', duration: '3:45', category: 'AI Features' },
  { icon: Shield, title: 'Integrity Monitoring & Proctoring', description: 'Understand how Sentinel detects anomalies and protects interview integrity.', duration: '4:10', category: 'AI Features' },
  { icon: BarChart3, title: 'Reading AI Evaluation Reports', description: 'Interpret scores, skill gaps, and personalized feedback for every interview.', duration: '5:30', category: 'Analysis' },
  { icon: Users, title: 'Building Your Talent Pool', description: 'Search, filter, and match candidates from your interview history.', duration: '3:50', category: 'Analysis' },
  { icon: FileText, title: 'Keyboard Shortcuts & Productivity', description: 'Master every shortcut to navigate the platform like a power user.', duration: '2:45', category: 'Tips' },
  { icon: Monitor, title: 'Customizing Your Workspace', description: 'Configure themes, panel layouts, and notification preferences.', duration: '2:20', category: 'Tips' },
];

const categories = Array.from(new Set(videos.map((v) => v.category)));

interface VideoKnowledgeBaseProps {
  searchQuery: string;
}

export function VideoKnowledgeBase({ searchQuery }: VideoKnowledgeBaseProps) {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const filtered = videos.filter((v) => {
    const matchesCategory = !activeCategory || v.category === activeCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase());
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
          Video Tutorials
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Short walkthroughs — most under 5 minutes
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

      {/* Video grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((video, index) => {
          const Icon = video.icon;
          return (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card variant="interactive" padding="md" className="h-full group">
                <div className="flex items-start gap-3">
                  {/* Thumbnail placeholder */}
                  <div className="relative w-[120px] h-[68px] shrink-0 rounded-lg bg-surface-tile-3 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center group-hover:bg-primary/30 group-hover:scale-105 transition-all duration-200">
                      <Play className="w-3.5 h-3.5 text-primary-on-dark ml-0.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] font-medium text-white group-hover:text-primary-on-dark transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-[11px] text-body-muted/50 mt-0.5 leading-relaxed line-clamp-2">
                      {video.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] font-mono text-body-muted/50 bg-white/[0.03] px-1.5 py-0.5 rounded">
                        {video.category}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] font-mono text-body-muted/50">
                        <Clock className="w-3 h-3" />
                        {video.duration}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card variant="default" padding="lg" className="text-center">
          <Play className="w-8 h-8 text-body-muted/20 mx-auto" />
          <p className="text-[13px] text-body-muted/50 mt-2">No videos match your search</p>
        </Card>
      )}
    </motion.div>
  );
}
