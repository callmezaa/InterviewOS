'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '../../../components/ui/Header';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { SkeletonCard } from '../../../components/ui/SkeletonCard';
import { fetchQuestion, deleteQuestion, voteQuestion, toggleBookmark } from '../../../lib/questions';
import { ArrowLeft, Edit3, Trash2, Bookmark, BookmarkCheck, Copy, Check, ChevronDown, ChevronUp, User, Clock, MessageSquare, Eye, ThumbsUp, ThumbsDown, Code, Lightbulb, Building2 } from 'lucide-react';
import type { QuestionDetail } from '@interviewos/shared';

const DIFFICULTY_COLORS: Record<string, 'success' | 'warning' | 'danger'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'danger',
};

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative group rounded-lg border border-white/[0.06] bg-black/40 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <span className="text-[11px] font-mono text-body-muted/50 uppercase tracking-wider">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-body-muted/40 hover:text-white rounded-md hover:bg-white/[0.06] transition-colors"
          aria-label={copied ? 'Copied' : 'Copy code'}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono text-body-muted/80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-white/[0.06] rounded-lg overflow-hidden bg-surface-tile-2/30">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 text-[13px] font-medium text-white/70 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-body-muted/40" />
          {title}
        </span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-body-muted/40" /> : <ChevronDown className="w-3.5 h-3.5 text-body-muted/40" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [question, setQuestion] = useState<QuestionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [userVote, setUserVote] = useState<1 | -1 | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchQuestion(id, controller.signal)
      .then((q) => {
        setQuestion(q);
        const conceptQuestions = Array.isArray(q.conceptQuestions) ? q.conceptQuestions : [];
        const hints = Array.isArray(q.hints) ? q.hints : [];
        setQuestion({ ...q, conceptQuestions, hints } as QuestionDetail);
      })
      .catch((err) => {
        if ((err as Error).name !== 'AbortError') console.error('Failed to load question:', err);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [id]);

  const handleVote = useCallback(async (value: 1 | -1) => {
    if (!question) return;
    try {
      const result = await voteQuestion(question.id, value);
      setUserVote(result.vote);
      setQuestion((prev) => {
        if (!prev) return prev;
        let up = prev.upvotes;
        let down = prev.downvotes;
        if (result.vote === null) {
          if (value === 1) up--;
          else down--;
        } else if (result.vote === 1) {
          up++;
          if (prev.downvotes > 0) down--;
        } else {
          down++;
          if (prev.upvotes > 0) up--;
        }
        return { ...prev, upvotes: up, downvotes: down };
      });
    } catch {}
  }, [question]);

  const handleBookmark = useCallback(async () => {
    if (!question) return;
    try {
      const result = await toggleBookmark(question.id);
      setBookmarked(result.bookmarked);
    } catch {}
  }, [question]);

  const handleDelete = useCallback(async () => {
    if (!question || !confirm('Are you sure you want to delete this question?')) return;
    setDeleting(true);
    try {
      await deleteQuestion(question.id);
      router.push('/questions');
    } catch {
      setDeleting(false);
    }
  }, [question, router]);

  if (loading) {
    return (
      <>
        <Header subTitle="Question Library" />
        <main id="main-content" className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        </main>
      </>
    );
  }

  if (!question) {
    return (
      <>
        <Header subTitle="Question Library" />
        <main id="main-content" className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
          <div className="text-center py-20">
            <p className="text-[15px] text-body-muted/60">Question not found</p>
            <Button variant="ghost" className="mt-4" onClick={() => router.push('/questions')}>
              Back to library
            </Button>
          </div>
        </main>
      </>
    );
  }

  const score = question.upvotes - question.downvotes;

  return (
    <>
      <Header subTitle="Question Library" />
      <main id="main-content" className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-8">
        <button
          onClick={() => router.push('/questions')}
          className="flex items-center gap-1.5 text-[13px] text-body-muted/50 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to library
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant={DIFFICULTY_COLORS[question.difficulty] || 'default'}>{question.difficulty}</Badge>
              <Badge variant={question.source === 'CURATED' ? 'primary' : 'default'}>
                {question.source === 'CURATED' ? 'Curated' : 'Community'}
              </Badge>
              {question.category && (
                <Badge variant="neutral">{question.category.name}</Badge>
              )}
            </div>
            <h1 className="text-2xl font-semibold text-white mb-3">{question.title}</h1>
            <p className="text-[14px] text-body-muted/70 leading-relaxed mb-6 whitespace-pre-wrap">{question.description}</p>

            {question.starterCode && (
              <div className="mb-6">
                <h2 className="text-[13px] font-semibold text-white/70 mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4 text-body-muted/40" />
                  Starter Code
                </h2>
                <CodeBlock code={question.starterCode} language={question.language} />
              </div>
            )}

            {question.solutionCode && (
              <CollapsibleSection title="Solution" icon={Code}>
                <CodeBlock code={question.solutionCode} language={question.language} />
              </CollapsibleSection>
            )}

            {question.testCode && (
              <CollapsibleSection title="Tests" icon={Code}>
                <CodeBlock code={question.testCode} language={question.language} />
              </CollapsibleSection>
            )}

            {question.conceptQuestions && question.conceptQuestions.length > 0 && (
              <CollapsibleSection title="Concept Questions" icon={MessageSquare} defaultOpen>
                <ul className="space-y-2">
                  {question.conceptQuestions.map((q, i) => (
                    <li key={i} className="text-[13px] text-body-muted/70 pl-4 border-l-2 border-primary/30">
                      {q}
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}

            {question.systemDesign && (
              <CollapsibleSection title="System Design" icon={Building2}>
                <p className="text-[13px] text-body-muted/70 leading-relaxed">{question.systemDesign}</p>
              </CollapsibleSection>
            )}

            {question.hints && question.hints.length > 0 && (
              <CollapsibleSection title="Hints" icon={Lightbulb}>
                <ol className="space-y-2 list-decimal list-inside">
                  {question.hints.map((hint, i) => (
                    <li key={i} className="text-[13px] text-body-muted/70">{hint}</li>
                  ))}
                </ol>
              </CollapsibleSection>
            )}
          </div>

          <div className="space-y-4">
            <div className="sticky top-8">
              <div className="bg-surface-tile-2/50 border border-white/[0.06] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-center gap-6 py-3">
                  <button
                    onClick={() => handleVote(1)}
                    className={`flex flex-col items-center gap-1 transition-colors ${userVote === 1 ? 'text-primary-on-dark' : 'text-body-muted/40 hover:text-primary-on-dark'}`}
                    aria-label="Upvote"
                  >
                    <ThumbsUp className="w-5 h-5" />
                    <span className="text-[11px]">Upvote</span>
                  </button>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{score}</div>
                    <div className="text-[11px] text-body-muted/40">votes</div>
                  </div>
                  <button
                    onClick={() => handleVote(-1)}
                    className={`flex flex-col items-center gap-1 transition-colors ${userVote === -1 ? 'text-red-400' : 'text-body-muted/40 hover:text-red-400'}`}
                    aria-label="Downvote"
                  >
                    <ThumbsDown className="w-5 h-5" />
                    <span className="text-[11px]">Downvote</span>
                  </button>
                </div>

                <div className="border-t border-white/[0.06] pt-4 space-y-3">
                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-[13px] transition-colors ${bookmarked ? 'bg-primary/10 text-primary-on-dark border border-primary/20' : 'text-body-muted/60 hover:bg-white/[0.04] border border-transparent'}`}
                  >
                    {bookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    {bookmarked ? 'Bookmarked' : 'Bookmark'}
                  </button>
                  <Button variant="primary" className="w-full" onClick={() => window.location.href = `/dashboard?question=${question.id}`}>
                    Use in Interview
                  </Button>
                </div>

                <div className="border-t border-white/[0.06] pt-4 space-y-2 text-[12px] text-body-muted/40">
                  {question.author && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5" />
                      <span>{question.author.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Created {new Date(question.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{question.viewCount} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{question.usageCount} uses in interviews</span>
                  </div>
                </div>

                {question.tags.length > 0 && (
                  <div className="border-t border-white/[0.06] pt-4">
                    <div className="flex flex-wrap gap-1.5">
                      {question.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.04] text-body-muted/50 border border-white/[0.04]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/[0.06] pt-4 flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => router.push(`/questions/${question.id}/edit`)}>
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                  <Button variant="danger" className="flex-1" onClick={handleDelete} disabled={deleting}>
                    <Trash2 className="w-3.5 h-3.5" />
                    {deleting ? 'Deleting...' : 'Delete'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
