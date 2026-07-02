'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Layout, Cpu, Code2, Search, Plus, User, Clock, MessageSquare,
  ChevronLeft, ChevronRight, Loader2, Bookmark, Star, Filter, ArrowUpDown,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Header } from '../../components/ui/Header';
import { EmptyState } from '../../components/ui/EmptyState';
import { IllustrationTemplate } from '../../components/ui/Illustrations';
import { fetchTemplates, voteTemplate, TemplateFilters } from '../../lib/templates';
import type { InterviewTemplate, TemplateCategory, PaginatedTemplates } from '@interviewos/shared';

const CATEGORY_META: Record<TemplateCategory, { icon: typeof Layout; color: string; label: string }> = {
  FRONTEND: { icon: Layout, color: 'text-sky-400', label: 'Frontend' },
  BACKEND:  { icon: Cpu,     color: 'text-emerald-400', label: 'Backend' },
  DSA:      { icon: Code2,   color: 'text-violet-400', label: 'DSA' },
};

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const SOURCE_BADGES: Record<string, { label: string; variant: 'default' | 'primary' }> = {
  CURATED: { label: 'Curated', variant: 'primary' },
  COMMUNITY: { label: 'Community', variant: 'default' },
};

const ALL_CATEGORIES: (TemplateCategory | 'ALL')[] = ['ALL', 'FRONTEND', 'BACKEND', 'DSA'];

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<InterviewTemplate[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TemplateFilters>({ page: 1, limit: 12 });
  const abortRef = useRef<AbortController | null>(null);

  const loadTemplates = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const result = await fetchTemplates(filters);
      setTemplates(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  const handleVote = async (id: string, value: 1 | -1) => {
    try {
      const result = await voteTemplate(id, value);
      setTemplates((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          let up = t.upvotes, down = t.downvotes;
          if (result.vote === null) {
            if (value === 1) up--; else down--;
          } else if (result.vote === 1) {
            up++;
            if (t.downvotes > 0 && value === 1) down--;
          } else {
            down++;
            if (t.upvotes > 0 && value === -1) up--;
          }
          return { ...t, upvotes: up, downvotes: down };
        }),
      );
    } catch {}
  };

  const handleUseTemplate = (templateId: string) => {
    router.push(`/dashboard?template=${templateId}`);
  };

  return (
    <>
      <Header subTitle="Templates" />
      <main id="main-content" className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-8">
        {/* Hero */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Interview Templates</h1>
            <p className="text-[13px] text-body-muted/60 mt-1">
              Browse curated and community templates for your interviews
              {total > 0 && <span> &mdash; {total} templates</span>}
            </p>
          </div>
          <Button variant="primary" onClick={() => router.push('/templates/new')}>
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted/40" />
            <input
              type="text"
              placeholder="Search templates..."
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="w-full h-10 pl-9 pr-4 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-white placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
            />
          </div>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilters({ ...filters, category: cat === 'ALL' ? undefined : cat, page: 1 })}
              className={`px-3 py-2 rounded-lg text-[12px] font-semibold transition-all border ${
                (filters.category || 'ALL') === cat
                  ? 'border-primary/30 bg-primary/10 text-primary-on-dark'
                  : 'border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03]'
              }`}
            >
              {cat === 'ALL' ? 'All' : CATEGORY_META[cat].label}
            </button>
          ))}
          <select
            value={filters.source || ''}
            onChange={(e) => setFilters({ ...filters, source: e.target.value || undefined, page: 1 })}
            className="h-10 px-3 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
          >
            <option value="">All Sources</option>
            <option value="CURATED">Curated</option>
            <option value="COMMUNITY">Community</option>
          </select>
          <select
            value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              setFilters({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
            }}
            className="h-10 px-3 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
          >
            <option value="createdAt-desc">Newest</option>
            <option value="upvotes-desc">Most Upvoted</option>
            <option value="usageCount-desc">Most Used</option>
            <option value="viewCount-desc">Most Viewed</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-lg bg-white/[0.02] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState
            illustration={<IllustrationTemplate />}
            title="No templates found"
            description="Create your first interview template to streamline your interview process."
            action={{ label: 'Create Template', onClick: () => router.push('/templates/new') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template, idx) => {
                const meta = CATEGORY_META[template.category] ?? CATEGORY_META.FRONTEND;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                  >
                    <Card
                      variant="ghost"
                      className="p-5 flex flex-col gap-3 border border-white/[0.06] hover:border-white/[0.12] transition-all duration-200 h-full"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg border border-white/[0.08] flex items-center justify-center shrink-0 bg-white/[0.03]`}>
                            <Icon className={`w-4 h-4 ${meta.color}`} />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[14px] font-semibold text-white leading-snug truncate">{template.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[11px] font-mono font-semibold ${meta.color}`}>{meta.label}</span>
                              {template.source && (
                                <Badge variant={SOURCE_BADGES[template.source]?.variant || 'default'} className="text-[9px] px-1 py-0">
                                  {SOURCE_BADGES[template.source]?.label || template.source}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* Vote */}
                        <div className="flex flex-col items-center gap-0.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVote(template.id, 1); }}
                            className="p-1 rounded hover:bg-white/[0.06] transition-colors text-body-muted/40 hover:text-primary-on-dark"
                            aria-label="Upvote"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <span className="text-[12px] font-semibold text-white/80">{template.upvotes - template.downvotes}</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVote(template.id, -1); }}
                            className="p-1 rounded hover:bg-white/[0.06] transition-colors text-body-muted/40 hover:text-red-400"
                            aria-label="Downvote"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-[12px] text-body-muted/60 leading-relaxed line-clamp-2 flex-1">
                        {template.description}
                      </p>

                      {template.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {template.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-body-muted/50 border border-white/[0.04]">
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="text-[10px] px-1.5 py-0.5 text-body-muted/30">+{template.tags.length - 3}</span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        <div className="flex items-center gap-2 text-[11px] text-body-muted/40">
                          {template.difficulty && (
                            <Badge variant={DIFFICULTY_COLORS[template.difficulty] || 'default'} className="text-[9px] px-1.5 py-0">
                              {template.difficulty}
                            </Badge>
                          )}
                          {template.author && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {template.author.name}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {template.usageCount} uses
                          </span>
                        </div>
                        <button
                          onClick={() => handleUseTemplate(template.id)}
                          className="text-[11px] font-medium text-primary hover:text-primary-on-dark transition-colors px-2 py-1"
                        >
                          Use
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={(filters.page || 1) <= 1}
                  className="p-2 rounded-lg bg-surface-tile-2/50 border border-white/[0.06] text-body-muted/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] text-body-muted/60 px-4">Page {filters.page || 1} of {totalPages}</span>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                  disabled={(filters.page || 1) >= totalPages}
                  className="p-2 rounded-lg bg-surface-tile-2/50 border border-white/[0.06] text-body-muted/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
