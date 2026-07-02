'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Loader2, Code, Server, Shield, HelpCircle, Check, X,
  ChevronDown, Save, BookOpen, Copy, RefreshCcw, Lightbulb,
} from 'lucide-react';
import { Button } from './Button';
import { Badge } from './Badge';
import { Card } from './Card';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { API_URL } from '../../lib/config';
import { createQuestion } from '../../lib/questions';
import { toast } from '../../store/useToastStore';
import type { QuestionDifficulty } from '@interviewos/shared';

interface AIChallenge {
  title: string;
  description: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
  language: string;
  difficulty: string;
  tags: string[];
  conceptQuestions: string[];
  systemDesign?: string;
  hints: string[];
}

const ROLES = [
  { id: 'frontend', label: 'Frontend', icon: Code },
  { id: 'backend', label: 'Backend', icon: Server },
  { id: 'devops', label: 'DevOps', icon: Shield },
  { id: 'design', label: 'Sys Design', icon: HelpCircle },
];

const LEVELS = [
  { id: 'junior', label: 'Junior', diff: 'EASY' },
  { id: 'mid', label: 'Mid-Level', diff: 'MEDIUM' },
  { id: 'senior', label: 'Senior', diff: 'HARD' },
];

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'kotlin', label: 'Kotlin' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
];

interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyChallenge: (code: string, language: string) => void;
}

export const AIQuestionGeneratorModal: React.FC<AIQuestionGeneratorModalProps> = ({
  isOpen,
  onClose,
  onApplyChallenge,
}) => {
  const modalRef = useFocusTrap(isOpen);
  const [jobRole, setJobRole] = useState('frontend');
  const [level, setLevel] = useState('mid');
  const [language, setLanguage] = useState('javascript');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState<1 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challenge, setChallenge] = useState<AIChallenge | null>(null);
  const [variations, setVariations] = useState<AIChallenge[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [applied, setApplied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setChallenge(null);
    setVariations([]);
    setApplied(false);

    try {
      const body: Record<string, unknown> = {
        jobRole,
        experienceLevel: level,
        language,
        difficulty: LEVELS.find((l) => l.id === level)?.diff || 'MEDIUM',
        count: count === 3 ? '3' : '1',
      };
      if (topic.trim()) body.topic = topic.trim();

      const response = await fetch(`${API_URL}/ai/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to generate questions');

      if (data.questions && Array.isArray(data.questions)) {
        setVariations(data.questions);
        setChallenge(data.questions[0]);
        setSelectedIdx(0);
      } else {
        setChallenge(data);
        setVariations([]);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not reach AI Service. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!challenge) return;
    onApplyChallenge(challenge.starterCode, challenge.language);
    setApplied(true);
    setTimeout(() => onClose(), 1200);
  };

  const handleSaveToLibrary = async () => {
    if (!challenge) return;
    setSaving(true);
    try {
      const diffMap: Record<string, QuestionDifficulty> = { EASY: 'EASY', MEDIUM: 'MEDIUM', HARD: 'HARD', junior: 'EASY', mid: 'MEDIUM', senior: 'HARD' };
      await createQuestion({
        title: challenge.title,
        description: challenge.description,
        difficulty: diffMap[challenge.difficulty] || 'MEDIUM',
        language: challenge.language,
        starterCode: challenge.starterCode || undefined,
        solutionCode: challenge.solutionCode || undefined,
        testCode: challenge.testCode || undefined,
        tags: challenge.tags || [],
        conceptQuestions: challenge.conceptQuestions?.length ? challenge.conceptQuestions : undefined,
        systemDesign: challenge.systemDesign || undefined,
        hints: challenge.hints?.length ? challenge.hints : undefined,
      });
      toast.success('Saved to Library', 'Question has been saved to your question library.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save question';
      toast.error('Save Failed', message);
    } finally {
      setSaving(false);
    }
  };

  const selectVariation = (idx: number) => {
    setSelectedIdx(idx);
    setChallenge(variations[idx]);
  };

  const activeChallenge = challenge;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-3xl max-h-[90vh] bg-surface-tile-2 border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h2 className="text-[15px] font-semibold text-white">AI Question Generator</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-body-muted/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            {/* Controls */}
            <div className="space-y-4">
              {/* Role selector */}
              <div>
                <label className="text-[11px] font-semibold text-body-muted/60 uppercase tracking-wider mb-2 block">Target Role</label>
                <div className="grid grid-cols-4 gap-2">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    const isActive = jobRole === r.id;
                    return (
                      <button
                        key={r.id}
                        onClick={() => setJobRole(r.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                          isActive
                            ? 'border-primary bg-primary/10 text-primary-on-dark'
                            : 'border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03]'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level + Language row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-semibold text-body-muted/60 uppercase tracking-wider mb-2 block">Difficulty</label>
                  <div className="flex gap-2">
                    {LEVELS.map((l) => (
                      <button
                        key={l.id}
                        onClick={() => setLevel(l.id)}
                        className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                          level === l.id
                            ? 'border-primary bg-primary/10 text-primary-on-dark'
                            : 'border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12] hover:bg-white/[0.03]'
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-body-muted/60 uppercase tracking-wider mb-2 block">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-[34px] px-3 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.value} value={l.value}>{l.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced options */}
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-1.5 text-[11px] text-body-muted/50 hover:text-body-muted/80 transition-colors"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                {showAdvanced ? 'Hide' : 'Show'} advanced options
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="text-[11px] font-semibold text-body-muted/60 uppercase tracking-wider mb-2 block">Topic / Focus</label>
                        <input
                          type="text"
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          placeholder="e.g. binary trees, REST APIs, caching"
                          className="w-full h-[34px] px-3 text-[12px] bg-white/[0.04] border border-white/[0.08] rounded-lg text-white placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-body-muted/60 uppercase tracking-wider mb-2 block">Variations</label>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setCount(1)}
                            className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                              count === 1
                                ? 'border-primary bg-primary/10 text-primary-on-dark'
                                : 'border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12]'
                            }`}
                          >
                            1 question
                          </button>
                          <button
                            onClick={() => setCount(3)}
                            className={`flex-1 px-3 py-2 rounded-lg text-[12px] font-medium border transition-all ${
                              count === 3
                                ? 'border-primary bg-primary/10 text-primary-on-dark'
                                : 'border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12]'
                            }`}
                          >
                            3 variations
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Generate button */}
              <Button
                variant="primary"
                onClick={handleGenerate}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Challenge{count === 3 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400">
                {error}
              </div>
            )}

            {/* Variation tabs */}
            {variations.length > 1 && (
              <div className="flex gap-2">
                {variations.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => selectVariation(i)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedIdx === i
                        ? 'border-primary bg-primary/10 text-primary-on-dark'
                        : 'border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12]'
                    }`}
                  >
                    #{i + 1}: {v.title.slice(0, 30)}{v.title.length > 30 ? '...' : ''}
                  </button>
                ))}
              </div>
            )}

            {/* Challenge display */}
            {activeChallenge && (
              <div className="space-y-3">
                {/* Title + badges */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-[15px] font-semibold text-white">{activeChallenge.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="primary" className="text-[9px] px-1.5 py-0">
                        {activeChallenge.language}
                      </Badge>
                      <Badge variant={
                        activeChallenge.difficulty === 'EASY' ? 'success' :
                        activeChallenge.difficulty === 'HARD' ? 'danger' : 'warning'
                      } className="text-[9px] px-1.5 py-0">
                        {activeChallenge.difficulty}
                      </Badge>
                      {activeChallenge.tags?.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.04] text-body-muted/50 border border-white/[0.04]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <Card variant="default" className="p-4">
                  <p className="text-[12px] text-body-muted/80 whitespace-pre-wrap leading-relaxed">
                    {activeChallenge.description}
                  </p>
                </Card>

                {/* Starter Code */}
                {activeChallenge.starterCode && (
                  <CollapsibleSection
                    title="Starter Code"
                    icon={<Code className="w-3.5 h-3.5" />}
                    defaultOpen
                  >
                    <pre className="text-[11px] text-body-muted/80 font-mono whitespace-pre-wrap overflow-x-auto">
                      {activeChallenge.starterCode}
                    </pre>
                  </CollapsibleSection>
                )}

                {/* Solution Code */}
                {activeChallenge.solutionCode && (
                  <CollapsibleSection
                    title="Solution"
                    icon={<Check className="w-3.5 h-3.5 text-green-400" />}
                  >
                    <pre className="text-[11px] text-body-muted/80 font-mono whitespace-pre-wrap overflow-x-auto">
                      {activeChallenge.solutionCode}
                    </pre>
                  </CollapsibleSection>
                )}

                {/* Test Code */}
                {activeChallenge.testCode && (
                  <CollapsibleSection
                    title="Test Cases"
                    icon={<Shield className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    <pre className="text-[11px] text-body-muted/80 font-mono whitespace-pre-wrap overflow-x-auto">
                      {activeChallenge.testCode}
                    </pre>
                  </CollapsibleSection>
                )}

                {/* Concept Questions */}
                {activeChallenge.conceptQuestions?.length > 0 && (
                  <CollapsibleSection
                    title="Concept Questions"
                    icon={<BookOpen className="w-3.5 h-3.5 text-blue-400" />}
                  >
                    <ol className="space-y-2">
                      {activeChallenge.conceptQuestions.map((q, i) => (
                        <li key={i} className="text-[12px] text-body-muted/80 flex gap-2">
                          <span className="text-body-muted/40 font-mono shrink-0">{i + 1}.</span>
                          {q}
                        </li>
                      ))}
                    </ol>
                  </CollapsibleSection>
                )}

                {/* System Design */}
                {activeChallenge.systemDesign && (
                  <CollapsibleSection
                    title="System Design"
                    icon={<Server className="w-3.5 h-3.5 text-violet-400" />}
                  >
                    <p className="text-[12px] text-body-muted/80">{activeChallenge.systemDesign}</p>
                  </CollapsibleSection>
                )}

                {/* Hints */}
                {activeChallenge.hints?.length > 0 && (
                  <CollapsibleSection
                    title="Hints"
                    icon={<Lightbulb className="w-3.5 h-3.5 text-amber-400" />}
                  >
                    <ol className="space-y-2">
                      {activeChallenge.hints.map((h, i) => (
                        <li key={i} className="text-[12px] text-body-muted/80 flex gap-2">
                          <span className="text-body-muted/40 font-mono shrink-0">{i + 1}.</span>
                          {h}
                        </li>
                      ))}
                    </ol>
                  </CollapsibleSection>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {activeChallenge && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.06] bg-surface-tile-3/30 shrink-0">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleSaveToLibrary}
                disabled={saving}
                className="text-[12px] flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save to Library
              </Button>
              <Button
                variant="secondary"
                onClick={handleGenerate}
                disabled={loading}
                className="text-[12px] flex items-center gap-1.5"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                Regenerate
              </Button>
            </div>
            <Button
              variant="primary"
              onClick={handleApply}
              disabled={applied}
              className="text-[12px] flex items-center gap-1.5"
            >
              {applied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Applied!
                </>
              ) : (
                <>
                  <Code className="w-3.5 h-3.5" />
                  Apply to Workspace
                </>
              )}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card variant="default" className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-[12px] font-semibold text-white/80 hover:text-white transition-colors"
      >
        {icon}
        {title}
        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-3 pt-1 border-t border-white/[0.04]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
