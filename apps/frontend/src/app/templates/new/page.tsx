'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Save, ArrowLeft, Layout, Cpu, Code2, Loader2 } from 'lucide-react';
import { Header } from '../../../components/ui/Header';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { CodeField } from '../../../components/ui/CodeField';
import { createTemplate } from '../../../lib/templates';
import { toast } from '../../../store/useToastStore';
import type { TemplateCategory, QuestionDifficulty } from '@interviewos/shared';

const CATEGORIES: { value: TemplateCategory; label: string; icon: typeof Layout }[] = [
  { value: 'FRONTEND', label: 'Frontend', icon: Layout },
  { value: 'BACKEND', label: 'Backend', icon: Cpu },
  { value: 'DSA', label: 'Data Structures & Algorithms', icon: Code2 },
];

const DIFFICULTIES: { value: QuestionDifficulty; label: string }[] = [
  { value: 'EASY', label: 'Easy' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HARD', label: 'Hard' },
];

const LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'sql', label: 'SQL' },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('FRONTEND');
  const [language, setLanguage] = useState('javascript');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | ''>('');
  const [starterCode, setStarterCode] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error('Validation Error', 'Title is required.'); return; }
    if (!description.trim()) { toast.error('Validation Error', 'Description is required.'); return; }

    setSaving(true);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10);
      const template = await createTemplate({
        title: title.trim(),
        description: description.trim(),
        category,
        language,
        difficulty: difficulty || undefined,
        starterCode: starterCode || undefined,
        tags,
      });
      toast.success('Template Created', 'Your community template has been submitted.');
      router.push(`/templates`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create template';
      toast.error('Creation Failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Header subTitle="New Template" />
      <main id="main-content" className="flex-1 w-full max-w-3xl mx-auto px-6 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-[12px] text-body-muted/60 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Layout className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Create Community Template</h1>
            <p className="text-[12px] text-body-muted/50">Share your interview approach with the community.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Card variant="default" className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-body-muted/70">Title *</label>
              <Input
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="e.g. React Hooks Deep Dive"
                maxLength={200}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-body-muted/70">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this template covers, what candidates should expect, and what interviewers should focus on..."
                maxLength={2000}
                rows={4}
                className="w-full px-3 py-2 text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-body-muted/70">Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                  className="h-10 px-3 text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-body-muted/70">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-10 px-3 text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>{l.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-body-muted/70">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty | '')}
                  className="h-10 px-3 text-[13px] bg-white/[0.03] border border-white/[0.08] rounded-lg text-body-muted focus:outline-none focus:border-primary/40"
                >
                  <option value="">Not specified</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-semibold text-body-muted/70">Tags</label>
                <Input
                  value={tagsInput}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsInput(e.target.value)}
                  placeholder="react, hooks, state (comma-separated)"
                />
              </div>
            </div>
          </Card>

          <Card variant="default" className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-semibold text-body-muted/70">Starter Code (optional)</label>
              <p className="text-[11px] text-body-muted/40">Provide initial code that candidates will start with.</p>
              <CodeField
                value={starterCode}
                onChange={setStarterCode}
                language={language}
                minHeight={200}
              />
            </div>
          </Card>

          <div className="flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => router.back()} className="px-4 py-2 border border-white/[0.06]">
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={saving} className="px-5 py-2 flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Creating...' : 'Create Template'}
            </Button>
          </div>
        </form>
      </main>
    </>
  );
}
