'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, BookOpen, Filter, ArrowUpDown, Plus, Loader2, ChevronLeft, ChevronRight, Clock, User, Star, MessageSquare, Download, Upload, FileJson, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { SkeletonCard } from '../../components/ui/SkeletonCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { IllustrationSearch } from '../../components/ui/Illustrations';
import { fetchQuestions, fetchCategories, exportQuestions, QuestionFilters, voteQuestion } from '../../lib/questions';
import QuestionImportModal from '../../components/questions/QuestionImportModal';
import type { QuestionSummary, QuestionCategory } from '@interviewos/shared';

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

const SOURCE_BADGES: Record<string, { label: string; variant: 'default' | 'primary' }> = {
  CURATED: { label: 'Curated', variant: 'primary' },
  COMMUNITY: { label: 'Community', variant: 'default' },
};

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const color = DIFFICULTY_COLORS[difficulty] || 'default';
  return <Badge variant={color}>{difficulty}</Badge>;
}

function QuestionCard({ question, onVote }: { question: QuestionSummary; onVote: (id: string, value: 1 | -1) => void }) {
  const router = useRouter();

  return (
    <motion.div
      onClick={() => router.push(`/questions/${question.id}`)}
      className="group relative bg-surface-tile-2/50 border border-white/[0.06] rounded-lg p-5 hover:bg-surface-tile-2/80 hover:border-white/[0.12] transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant={SOURCE_BADGES[question.source]?.variant || 'default'}>
              {SOURCE_BADGES[question.source]?.label || question.source}
            </Badge>
            <DifficultyBadge difficulty={question.difficulty} />
            {question.category && (
              <Badge variant="neutral">{question.category.name}</Badge>
            )}
          </div>
          <h3 className="text-[15px] font-semibold text-white group-hover:text-primary-on-dark transition-colors truncate">
            {question.title}
          </h3>
          <p className="text-[13px] text-body-muted/60 mt-1 line-clamp-2 leading-relaxed">
            {question.description}
          </p>
          {question.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {question.tags.slice(0, 4).map((tag) => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-body-muted/50 border border-white/[0.04]">
                  {tag}
                </span>
              ))}
              {question.tags.length > 4 && (
                <span className="text-[11px] px-2 py-0.5 text-body-muted/40">
                  +{question.tags.length - 4}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mt-3 text-[12px] text-body-muted/40">
            {question.author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {question.author.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(question.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {question.usageCount} uses
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onVote(question.id, 1); }}
            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-body-muted/40 hover:text-primary-on-dark"
            aria-label="Upvote"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="18 15 12 9 6 15" />
            </svg>
          </button>
          <span className="text-[13px] font-semibold text-white/80">{question.upvotes - question.downvotes}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onVote(question.id, -1); }}
            className="p-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-body-muted/40 hover:text-red-400"
            aria-label="Downvote"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function FilterBar({
  categories,
  filters,
  onFilterChange,
}: {
  categories: QuestionCategory[];
  filters: QuestionFilters;
  onFilterChange: (f: QuestionFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-muted/40" />
        <input
          type="text"
          placeholder="Search questions..."
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value, page: 1 })}
          className="w-full h-10 pl-9 pr-4 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-white placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
        />
      </div>
      <select
        value={filters.difficulty || ''}
        onChange={(e) => onFilterChange({ ...filters, difficulty: e.target.value || undefined, page: 1 })}
        className="h-10 px-3 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
      >
        <option value="">All Difficulties</option>
        <option value="EASY">Easy</option>
        <option value="MEDIUM">Medium</option>
        <option value="HARD">Hard</option>
      </select>
      <select
        value={filters.categoryId || ''}
        onChange={(e) => onFilterChange({ ...filters, categoryId: e.target.value || undefined, page: 1 })}
        className="h-10 px-3 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>
      <select
        value={filters.source || ''}
        onChange={(e) => onFilterChange({ ...filters, source: e.target.value || undefined, page: 1 })}
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
          onFilterChange({ ...filters, sortBy, sortOrder: sortOrder as 'asc' | 'desc' });
        }}
        className="h-10 px-3 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
      >
        <option value="createdAt-desc">Newest</option>
        <option value="createdAt-asc">Oldest</option>
        <option value="upvotes-desc">Most Upvoted</option>
        <option value="usageCount-desc">Most Used</option>
        <option value="viewCount-desc">Most Viewed</option>
      </select>
    </div>
  );
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<QuestionFilters>({ page: 1, limit: 20 });
  const abortRef = useRef<AbortController | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState<'json' | 'csv' | null>(null);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const loadQuestions = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const result = await fetchQuestions(filters, controller.signal);
      setQuestions(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Failed to load questions:', err);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'json' | 'csv') => {
    setExporting(format);
    setShowExportMenu(false);
    try {
      await exportQuestions(format);
    } catch (err: unknown) {
      console.error('Export failed:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleVote = async (id: string, value: 1 | -1) => {
    try {
      const result = await voteQuestion(id, value);
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          const oldScore = q.upvotes - q.downvotes;
          let up = q.upvotes;
          let down = q.downvotes;
          if (result.vote === null) {
            if (value === 1) up--;
            else down--;
          } else if (result.vote === 1) {
            up++;
            if (q.downvotes > 0 && value === 1) down--;
          } else {
            down++;
            if (q.upvotes > 0 && value === -1) up--;
          }
          return { ...q, upvotes: up, downvotes: down };
        })
      );
    } catch {}
  };

  return (
    <>
      <Header subTitle="Question Library" />
      <main id="main-content" className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-white">Question Library</h1>
            <p className="text-[13px] text-body-muted/60 mt-1">
              Browse curated and community questions for your interviews
              {total > 0 && <span> &mdash; {total} questions</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setShowImportModal(true)}>
              <Upload className="w-4 h-4" />
              Import
            </Button>

            <div ref={exportRef} className="relative">
              <Button
                variant="secondary"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting !== null}
              >
                {exporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {exporting ? `Exporting ${exporting.toUpperCase()}...` : 'Export'}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>

              <AnimatePresence>
                {showExportMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-1 w-44 bg-surface-tile-2 border border-white/[0.08] rounded-lg shadow-xl overflow-hidden z-30"
                  >
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-body-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <FileJson className="w-4 h-4" />
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] text-body-muted hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      Export as CSV
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button variant="primary" onClick={() => window.location.href = '/questions/new'}>
              <Plus className="w-4 h-4" />
              New Question
            </Button>
          </div>
        </div>

        <FilterBar categories={categories} filters={filters} onFilterChange={setFilters} />

        {loading ? (
          <div className="grid gap-4 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <EmptyState
            illustration={<IllustrationSearch />}
            title="No questions found"
            description="Try adjusting your filters or create a new question to get started."
            action={{ label: 'New Question', onClick: () => window.location.href = '/questions/new', variant: 'primary' }}
          />
        ) : (
          <>
            <div className="grid gap-4 mt-6">
              {questions.map((q) => (
                <QuestionCard key={q.id} question={q} onVote={handleVote} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, (f.page || 1) - 1) }))}
                  disabled={(filters.page || 1) <= 1}
                  className="p-2 rounded-lg bg-surface-tile-2/50 border border-white/[0.06] text-body-muted/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[13px] text-body-muted/60 px-4">
                  Page {filters.page || 1} of {totalPages}
                </span>
                <button
                  onClick={() => setFilters((f) => ({ ...f, page: Math.min(totalPages, (f.page || 1) + 1) }))}
                  disabled={(filters.page || 1) >= totalPages}
                  className="p-2 rounded-lg bg-surface-tile-2/50 border border-white/[0.06] text-body-muted/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <QuestionImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImported={() => {
          setShowImportModal(false);
          loadQuestions();
        }}
      />
    </>
  );
}
