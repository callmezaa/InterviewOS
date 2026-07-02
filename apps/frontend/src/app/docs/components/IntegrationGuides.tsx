'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Puzzle,
  Globe,
  MessageSquare,
  GitBranch,
  Database,
  MessageCircleCode,
  Users,
  Bot,
  Webhook,
  Link2,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

interface Integration {
  icon: React.ElementType;
  name: string;
  description: string;
  status: 'available' | 'coming-soon' | 'beta';
  category: string;
}

const integrations: Integration[] = [
  {
    icon: MessageCircleCode,
    name: 'Slack',
    description: 'Receive interview notifications and share feedback directly in your workspace channels.',
    status: 'available',
    category: 'Communication',
  },
  {
    icon: MessageSquare,
    name: 'Microsoft Teams',
    description: 'Schedule and join interviews directly from Teams with calendar sync.',
    status: 'beta',
    category: 'Communication',
  },
  {
    icon: GitBranch,
    name: 'GitHub',
    description: 'Import repositories as interview challenges and assess real-world code.',
    status: 'available',
    category: 'Developer Tools',
  },
  {
    icon: Database,
    name: 'Greenhouse ATS',
    description: 'Sync interview scores and feedback automatically to your ATS pipeline.',
    status: 'available',
    category: 'HR & ATS',
  },
  {
    icon: Users,
    name: 'Lever',
    description: 'Push candidate evaluations and transcripts directly to Lever profiles.',
    status: 'coming-soon',
    category: 'HR & ATS',
  },
  {
    icon: Globe,
    name: 'Ashby',
    description: 'Two-way sync between Ashby and InterviewOS for seamless hiring workflows.',
    status: 'coming-soon',
    category: 'HR & ATS',
  },
  {
    icon: Bot,
    name: 'Zapier',
    description: 'Connect InterviewOS with 5,000+ apps through automated workflows.',
    status: 'beta',
    category: 'Automation',
  },
  {
    icon: Webhook,
    name: 'Webhooks',
    description: 'Build custom integrations with our event-driven webhook API.',
    status: 'available',
    category: 'Developer Tools',
  },
  {
    icon: Link2,
    name: 'Calendly',
    description: 'Let candidates book interview slots directly through your Calendly link.',
    status: 'coming-soon',
    category: 'Scheduling',
  },
  {
    icon: MessageSquare,
    name: 'Discord',
    description: 'Receive interview alerts and summaries in your Discord server channels.',
    status: 'coming-soon',
    category: 'Communication',
  },
];

const statusConfig = {
  available: { label: 'Available', variant: 'success' as const },
  beta: { label: 'Beta', variant: 'warning' as const },
  'coming-soon': { label: 'Soon', variant: 'neutral' as const },
};

const categories = Array.from(new Set(integrations.map((i) => i.category)));

export function IntegrationGuides() {
  const [activeCategory, setActiveCategory] = React.useState<string | null>(null);

  const filtered = activeCategory
    ? integrations.filter((i) => i.category === activeCategory)
    : integrations;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          Integrations
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Connect InterviewOS with your existing tools and workflows
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
      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((integration, index) => {
          const Icon = integration.icon;
          const status = statusConfig[integration.status];
          return (
            <motion.div
              key={integration.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
            >
              <Card
                variant={integration.status === 'coming-soon' ? 'default' : 'interactive'}
                padding="md"
                className={`h-full group ${integration.status === 'coming-soon' ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                    <Icon className="w-4.5 h-4.5 text-body-muted/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-white">{integration.name}</h3>
                      <Badge size="sm" variant={status.variant}>{status.label}</Badge>
                    </div>
                    <p className="text-[12px] text-body-muted/50 mt-1 leading-relaxed">
                      {integration.description}
                    </p>
                    <span className="text-[10px] text-body-muted/20 mt-2 block font-mono">
                      {integration.category}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* API CTA */}
      <Card variant="elevated" padding="md" className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Puzzle className="w-5 h-5 text-primary-on-dark" />
          <h3 className="text-[14px] font-semibold text-white">Need a custom integration?</h3>
        </div>
        <p className="text-[12px] text-body-muted/50 mt-1">
          InterviewOS provides a full REST API and webhook system. Check our API documentation or
          contact our team for enterprise integration support.
        </p>
      </Card>
    </motion.div>
  );
}
