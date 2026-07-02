'use client';

import React, { useCallback } from 'react';
import { Plus, Layout, Cpu, Code2, X, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';

interface ScheduleFormProps {
  title: string;
  onTitleChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  candidateEmail: string;
  onCandidateEmailChange: (v: string) => void;
  scheduledTime: string;
  onScheduledTimeChange: (v: string) => void;
  submitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  templateId?: string | null;
  onClearTemplate?: () => void;
  recurrenceEnabled?: boolean;
  onRecurrenceToggle?: (v: boolean) => void;
  recurrenceFrequency?: RecurrenceFrequency;
  onRecurrenceFrequencyChange?: (v: RecurrenceFrequency) => void;
  recurrenceEndOccurrences?: number;
  onRecurrenceEndOccurrencesChange?: (v: number) => void;
}

const TEMPLATES = [
  {
    id: 'frontend',
    title: 'Frontend Engineering',
    description: 'React component architecture, state management, styling approach, and frontend system design.',
    icon: Layout,
    color: 'text-sky-400',
    border: 'border-sky-400/20 hover:border-sky-400/40',
    bg: 'bg-sky-400/8',
  },
  {
    id: 'backend',
    title: 'Backend Systems',
    description: 'API design, database schema, system architecture, and backend engineering patterns.',
    icon: Cpu,
    color: 'text-emerald-400',
    border: 'border-emerald-400/20 hover:border-emerald-400/40',
    bg: 'bg-emerald-400/8',
  },
  {
    id: 'dsa',
    title: 'Problem Solving (DSA)',
    description: 'Algorithms, data structures, time/space complexity, and optimization techniques.',
    icon: Code2,
    color: 'text-violet-400',
    border: 'border-violet-400/20 hover:border-violet-400/40',
    bg: 'bg-violet-400/8',
  },
];

const FREQ_LABELS: Record<RecurrenceFrequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Biweekly',
  MONTHLY: 'Monthly',
};

export function ScheduleForm({
  title, onTitleChange,
  description, onDescriptionChange,
  candidateEmail, onCandidateEmailChange,
  scheduledTime, onScheduledTimeChange,
  submitting, onSubmit,
  templateId, onClearTemplate,
  recurrenceEnabled = false,
  onRecurrenceToggle,
  recurrenceFrequency = 'WEEKLY',
  onRecurrenceFrequencyChange,
  recurrenceEndOccurrences = 12,
  onRecurrenceEndOccurrencesChange,
}: ScheduleFormProps) {
  const activeTemplate = TEMPLATES.find((t) => t.title === title && t.description === description);
  const isFromTemplate = !!templateId;

  const applyTemplate = useCallback((t: typeof TEMPLATES[number]) => {
    onTitleChange(t.title);
    onDescriptionChange(t.description);
  }, [onTitleChange, onDescriptionChange]);

  return (
    <Card id="schedule-form" variant="ghost" className="p-6 flex flex-col gap-6">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-4">
        <Plus className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-h3 text-white">
          Schedule Interview
        </h3>
        {isFromTemplate && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] font-mono font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
            From Template
            {onClearTemplate && (
              <button type="button" onClick={onClearTemplate} className="hover:text-white transition-colors" aria-label="Clear template">
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[11px] text-body-muted/50 font-mono font-semibold">Quick Start Templates</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isActive = activeTemplate?.id === t.id;
            return (
              <motion.button
                key={t.id}
                type="button"
                onClick={() => applyTemplate(t)}
                whileTap={{ scale: 0.98 }}
                className={`flex items-start gap-2.5 p-3 rounded-lg border text-left transition-all duration-200 ${
                  isActive
                    ? `${t.border} ${t.bg}`
                    : 'border-white/[0.06] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 mt-0.5 ${
                  isActive ? `${t.border} ${t.bg}` : 'border-white/[0.06] bg-white/[0.03]'
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${isActive ? t.color : 'text-white/40'}`} />
                </div>
                <div className="min-w-0">
                  <span className={`block text-[12px] font-semibold leading-snug ${isActive ? 'text-white' : 'text-white/70'}`}>
                    {t.title}
                  </span>
                  <span className={`block text-[10px] mt-0.5 leading-relaxed line-clamp-2 ${isActive ? 'text-white/50' : 'text-body-muted/40'}`}>
                    {t.description}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" aria-label="Schedule interview form">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-title" className="text-[11px] text-body-muted/60 font-mono font-semibold">
            Session Title
          </label>
          <Input
            id="sched-title"
            type="text"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. React Frontend Architecture"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-desc" className="text-[11px] text-body-muted/60 font-mono font-semibold">
            Description (Optional)
          </label>
          <textarea
            id="sched-desc"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Topics, environment specifications..."
            rows={3}
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 text-[14px] text-white placeholder:text-white/20 outline-none transition-all duration-200 resize-none focus:border-primary/50 focus:bg-white/[0.04] hover:border-white/[0.12] hover:bg-white/[0.04]"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-email" className="text-[11px] text-body-muted/60 font-mono font-semibold">
            Candidate Email
          </label>
          <Input
            id="sched-email"
            type="email"
            required
            value={candidateEmail}
            onChange={(e) => onCandidateEmailChange(e.target.value)}
            placeholder="candidate@gmail.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="sched-time" className="text-[11px] text-body-muted/60 font-mono font-semibold">
            Date & Time
          </label>
          <Input
            id="sched-time"
            type="datetime-local"
            required
            value={scheduledTime}
            onChange={(e) => onScheduledTimeChange(e.target.value)}
            title="Interview date and time"
            placeholder="Select date and time"
            className="[color-scheme:dark]"
          />
        </div>

        {/* Recurrence Toggle */}
        <div className="border-t border-white/[0.06] pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className={`w-4 h-4 ${recurrenceEnabled ? 'text-primary' : 'text-body-muted/40'}`} />
              <span className="text-[13px] font-medium text-white">Repeat</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={recurrenceEnabled}
              onClick={() => onRecurrenceToggle?.(!recurrenceEnabled)}
              className={`relative w-10 h-5 rounded-full transition-all duration-200 ${
                recurrenceEnabled ? 'bg-primary' : 'bg-white/[0.1]'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 shadow-sm ${
                recurrenceEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {recurrenceEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 mt-4"
            >
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-body-muted/60 font-mono font-semibold">
                  Frequency
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(Object.entries(FREQ_LABELS) as [RecurrenceFrequency, string][]).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => onRecurrenceFrequencyChange?.(key)}
                      className={`px-3 py-2 text-[12px] font-medium rounded-lg border transition-all duration-200 ${
                        recurrenceFrequency === key
                          ? 'bg-primary/10 border-primary/30 text-primary-on-dark'
                          : 'bg-white/[0.03] border-white/[0.06] text-body-muted/60 hover:text-white hover:border-white/[0.12]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="sched-occurrences" className="text-[11px] text-body-muted/60 font-mono font-semibold">
                  End after (occurrences)
                </label>
                <Input
                  id="sched-occurrences"
                  type="number"
                  min={1}
                  max={365}
                  value={recurrenceEndOccurrences}
                  onChange={(e) => onRecurrenceEndOccurrencesChange?.(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="12"
                  className="w-24"
                />
                <span className="text-[10px] text-body-muted/40 mt-0.5">
                  {recurrenceFrequency === 'WEEKLY' && `~${Math.floor(recurrenceEndOccurrences * 7 / 30)} months of interviews`}
                  {recurrenceFrequency === 'BIWEEKLY' && `~${Math.floor(recurrenceEndOccurrences * 14 / 30)} months of interviews`}
                  {recurrenceFrequency === 'MONTHLY' && `~${recurrenceEndOccurrences} months of interviews`}
                  {recurrenceFrequency === 'DAILY' && `~${recurrenceEndOccurrences} days of interviews`}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
          className="w-full mt-2 py-2.5 flex items-center justify-center gap-1.5"
          aria-label={submitting ? 'Scheduling interview' : 'Schedule interview room'}
        >
          <span>{submitting ? 'Scheduling...' : recurrenceEnabled ? 'Schedule Series' : 'Schedule Room'}</span>
          {!submitting && (
            <svg className="w-4 h-4" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 3.5L10.5 8L6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </Button>
      </form>
    </Card>
  );
}
