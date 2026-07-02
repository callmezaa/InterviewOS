'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { CodeField } from '../ui/CodeField';
import { fetchCategories } from '../../lib/questions';
import { Loader2, ArrowLeft } from 'lucide-react';
import type { QuestionCategory, QuestionDetail } from '@interviewos/shared';

interface QuestionFormData {
  title: string;
  description: string;
  difficulty: string;
  language: string;
  categoryId: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
  tags: string;
  conceptQuestions: string;
  systemDesign: string;
  hints: string;
}

interface QuestionFormProps {
  mode: 'create' | 'edit';
  initialData?: QuestionDetail;
  questionId?: string;
  onSubmit: (data: Record<string, unknown>) => Promise<{ id: string }>;
}

const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust', 'kotlin', 'ruby', 'php', 'swift', 'sql'];

export function QuestionForm({ mode, initialData, questionId, onSubmit }: QuestionFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<QuestionFormData>({
    title: '',
    description: '',
    difficulty: 'MEDIUM',
    language: 'typescript',
    categoryId: '',
    starterCode: '',
    solutionCode: '',
    testCode: '',
    tags: '',
    conceptQuestions: '',
    systemDesign: '',
    hints: '',
  });

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        description: initialData.description,
        difficulty: initialData.difficulty,
        language: initialData.language,
        categoryId: initialData.category?.id || '',
        starterCode: initialData.starterCode || '',
        solutionCode: initialData.solutionCode || '',
        testCode: initialData.testCode || '',
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(', ') : '',
        conceptQuestions: Array.isArray(initialData.conceptQuestions) ? initialData.conceptQuestions.join('\n') : '',
        systemDesign: initialData.systemDesign || '',
        hints: Array.isArray(initialData.hints) ? initialData.hints.join('\n') : '',
      });
    }
  }, [initialData]);

  const update = (field: keyof QuestionFormData, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.description.trim()) { setError('Description is required'); return; }

    setSubmitting(true);
    try {
      const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean);
      const conceptQuestions = form.conceptQuestions.split('\n').map((t) => t.trim()).filter(Boolean);
      const hints = form.hints.split('\n').map((t) => t.trim()).filter(Boolean);

      const payload: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        difficulty: form.difficulty,
        language: form.language,
        categoryId: form.categoryId || undefined,
        starterCode: form.starterCode || undefined,
        solutionCode: form.solutionCode || undefined,
        testCode: form.testCode || undefined,
        tags: tags.length > 0 ? tags : undefined,
        conceptQuestions: conceptQuestions.length > 0 ? conceptQuestions : undefined,
        systemDesign: form.systemDesign || undefined,
        hints: hints.length > 0 ? hints : undefined,
      };

      const result = await onSubmit(payload);
      router.push(`/questions/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const backHref = mode === 'edit' && questionId ? `/questions/${questionId}` : '/questions';
  const submitLabel = mode === 'create' ? 'Create Question' : 'Save Changes';
  const submittingLabel = mode === 'create' ? 'Creating...' : 'Saving...';

  return (
    <>
      <button
        onClick={() => router.push(backHref)}
        className="flex items-center gap-1.5 text-[13px] text-body-muted/50 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {mode === 'edit' ? 'Back to question' : 'Back to library'}
      </button>

      <h1 className="text-2xl font-semibold text-white mb-6">
        {mode === 'create' ? 'Create Question' : 'Edit Question'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-[13px] text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Input
              label="Title"
              placeholder="e.g., Two Sum"
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-[13px] font-medium text-white/70 mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-white placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors resize-y"
              placeholder="Describe the problem in detail..."
              required
            />
          </div>
          <Field label="Difficulty">
            <select
              value={form.difficulty}
              onChange={(e) => update('difficulty', e.target.value)}
              className="h-10 w-full px-3 text-[13px] bg-surface-tile-2 border border-white/[0.06] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </Field>
          <Field label="Language">
            <select
              value={form.language}
              onChange={(e) => update('language', e.target.value)}
              className="h-10 w-full px-3 text-[13px] bg-surface-tile-2 border border-white/[0.06] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              value={form.categoryId}
              onChange={(e) => update('categoryId', e.target.value)}
              className="h-10 w-full px-3 text-[13px] bg-surface-tile-2 border border-white/[0.06] rounded-md text-white focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Input
            label="Tags (comma-separated)"
            placeholder="arrays, hash-map, sorting"
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
          />
        </div>

        <CodeSection
          label="Starter Code"
          placeholder="// Code template given to candidates"
          value={form.starterCode}
          language={form.language}
          onChange={(v) => update('starterCode', v)}
        />

        <CodeSection
          label="Solution Code"
          placeholder="// Reference solution"
          value={form.solutionCode}
          language={form.language}
          onChange={(v) => update('solutionCode', v)}
        />

        <CodeSection
          label="Test Code"
          placeholder="// Test cases"
          value={form.testCode}
          language={form.language}
          onChange={(v) => update('testCode', v)}
        />

        <TextSection
          label="Concept Questions"
          hint="(one per line)"
          placeholder="What is the time complexity of this solution?"
          value={form.conceptQuestions}
          onChange={(v) => update('conceptQuestions', v)}
        />

        <TextSection
          label="System Design Prompt"
          placeholder="Design a system that..."
          value={form.systemDesign}
          onChange={(v) => update('systemDesign', v)}
        />

        <TextSection
          label="Hints"
          hint="(one per line)"
          placeholder="Consider using a hash map..."
          value={form.hints}
          onChange={(v) => update('hints', v)}
        />

        <div className="flex items-center gap-3 pt-4 border-t border-white/[0.06]">
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? submittingLabel : submitLabel}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
        </div>
      </form>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] text-white/50 font-medium">{label}</label>
      {children}
    </div>
  );
}

function CodeSection({
  label, placeholder, value, language, onChange,
}: {
  label: string; placeholder: string; value: string; language: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[13px] font-medium text-white/70">{label}</label>
      <CodeField
        value={value}
        onChange={onChange}
        language={language}
        minHeight={140}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextSection({
  label, hint, placeholder, value, onChange,
}: {
  label: string; hint?: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-[13px] font-medium text-white/70">
        {label} {hint && <span className="text-body-muted/30 font-normal">{hint}</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full px-3 py-2 text-[13px] bg-surface-tile-2/60 border border-white/[0.08] rounded-lg text-white placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 transition-colors resize-y"
        placeholder={placeholder}
      />
    </div>
  );
}
