'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Play,
  Users,
  Calendar,
  Monitor,
  FileText,
  BarChart3,
  Star,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';

interface Step {
  icon: React.ElementType;
  title: string;
  description: string;
  details: string[];
  actionLabel?: string;
  actionHref?: string;
}

const steps: Step[] = [
  {
    icon: Play,
    title: 'Welcome to InterviewOS',
    description: 'Your all-in-one platform for conducting technical interviews that feel like real collaboration.',
    details: [
      'InterviewOS combines video calls, live coding, whiteboard, and AI evaluation in one seamless experience.',
      'Both interviewers and candidates can join from anywhere — no downloads required.',
      'Every interview is recorded, transcribed, and analyzed by AI for instant feedback.',
    ],
  },
  {
    icon: Calendar,
    title: 'Schedule Your First Interview',
    description: 'Set up an interview in seconds and invite your candidate with a single link.',
    details: [
      'Go to your Dashboard and fill in the schedule form with title, description, and candidate email.',
      'Pick a date and time that works for both parties.',
      'The candidate receives an invite with a secure link — no account needed to join.',
    ],
  },
  {
    icon: Monitor,
    title: 'Configure the Interview Room',
    description: 'Set up coding challenges, whiteboard exercises, and recording preferences.',
    details: [
      'Choose from our challenge library or create custom coding exercises.',
      'Enable the collaborative whiteboard for system design discussions.',
      'Toggle recording, transcription, and proctoring features as needed.',
    ],
  },
  {
    icon: Users,
    title: 'Conduct the Interview',
    description: 'Everything you need runs in one unified interface — video, code, and collaboration.',
    details: [
      'Use the 3-panel layout: video sidebar, main content area, and collapsible info panel.',
      'Switch between Code Editor, Whiteboard, and Console with one click.',
      'AI Copilot assists with real-time suggestions and time management.',
    ],
  },
  {
    icon: FileText,
    title: 'Review with AI Feedback',
    description: 'Get instant AI evaluation with detailed scoring and actionable insights.',
    details: [
      'After the interview, AI evaluates technical skills, communication, and problem-solving approach.',
      'View the transcript with timestamps and speaker labels.',
      'Review code snapshots with playback to see the candidate\'s thought process.',
    ],
  },
  {
    icon: BarChart3,
    title: 'Analyze & Improve',
    description: 'Track hiring metrics and build a talent pool from every interview you conduct.',
    details: [
      'The dashboard shows your success rate, average scores, and interview volume.',
      'All candidates are stored in your searchable talent pool for future positions.',
      'Share verifiable credentials with top candidates to build your employer brand.',
    ],
  },
  {
    icon: Star,
    title: 'Pro Tips & Next Steps',
    description: 'You\'re all set! Here are some tips to get the most out of InterviewOS.',
    details: [
      'Use keyboard shortcuts (press ? to see all) to navigate faster during interviews.',
      'Enable Blind Interview Mode to reduce bias in technical evaluations.',
      'Integrate with Slack or your ATS to streamline your hiring workflow.',
      'Explore the command palette (Cmd+K) to access every feature instantly.',
    ],
  },
];

const STORAGE_KEY = 'docs_playbook_progress';

export function GettingStartedPlaybook() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: number[] = JSON.parse(saved);
        setCompletedSteps(new Set(parsed));
        setCurrentStep(parsed.length);
      }
    } catch {}
  }, []);

  const persistProgress = (steps: Set<number>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(steps)));
    } catch {}
  };

  const goToStep = (index: number) => {
    setDirection(index > currentStep ? 1 : -1);
    setCurrentStep(index);
  };

  const markComplete = (stepIndex: number) => {
    const next = new Set(completedSteps);
    next.add(stepIndex);
    setCompletedSteps(next);
    persistProgress(next);
    if (stepIndex < steps.length - 1) {
      goToStep(stepIndex + 1);
    }
  };

  const resetProgress = () => {
    setCompletedSteps(new Set());
    setCurrentStep(0);
    localStorage.removeItem(STORAGE_KEY);
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isCompleted = completedSteps.has(currentStep);
  const allDone = completedSteps.size === steps.length;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 320 : -320, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -320 : 320, opacity: 0 }),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          Getting Started Playbook
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Follow this interactive guide to master InterviewOS in 7 steps
        </p>
        <p className="text-[11px] text-body-muted/50 mt-1">
          {completedSteps.size} of {steps.length} steps completed
        </p>
      </div>

      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((completedSteps.size) / steps.length) * 100}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-primary/30"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center gap-2">
        {steps.map((_, index) => {
          const isActive = index === currentStep;
          const done = completedSteps.has(index);
          return (
            <button
              key={index}
              onClick={() => goToStep(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                isActive
                  ? 'w-8 bg-primary'
                  : done
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-white/[0.08] hover:bg-white/[0.15]'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          );
        })}
      </div>

      {/* Step card */}
      <Card variant="ghost" padding="lg" className="relative overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                isCompleted
                  ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                  : 'bg-primary/10 text-primary-on-dark border border-primary/20'
              }`}>
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono font-semibold text-body-muted/50">
                    Step {currentStep + 1}/{steps.length}
                  </span>
                  {isCompleted && (
                    <span className="text-[10px] font-semibold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-pill border border-green-500/20">
                      Completed
                    </span>
                  )}
                </div>
                <h2 className="text-[18px] font-display font-semibold text-white tracking-tight mt-1">
                  {step.title}
                </h2>
                <p className="text-[13px] text-body-muted/70 mt-1.5 leading-relaxed">
                  {step.description}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {step.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-[12px] text-body-muted/50 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-primary/50 mt-1.5 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
          <div>
            {currentStep > 0 && (
              <Button
                variant="ghost"
                onClick={() => goToStep(currentStep - 1)}
                className="text-body-muted/50 hover:text-white"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <Button
                variant="primary"
                onClick={() => markComplete(currentStep)}
                className="bg-primary hover:bg-primary-focus text-white"
              >
                {currentStep === steps.length - 1 ? 'Complete Guide' : 'Mark Complete & Continue'}
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : currentStep < steps.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => goToStep(currentStep + 1)}
                className="bg-primary hover:bg-primary-focus text-white"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={resetProgress}
                className="bg-primary hover:bg-primary-focus text-white"
              >
                Start Over
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Completion banner */}
      {allDone && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card variant="elevated" padding="lg" className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/20 flex items-center justify-center mx-auto">
              <Star className="w-7 h-7 text-green-400" />
            </div>
            <h3 className="text-[18px] font-display font-semibold text-white mt-4">
              Playbook Complete!
            </h3>
            <p className="text-[13px] text-body-muted/60 mt-1 max-w-md mx-auto">
              You&apos;ve mastered all 7 steps. You&apos;re ready to run world-class technical
              interviews. Explore Best Practices to take your skills further.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <Button
                variant="ghost"
                onClick={resetProgress}
                className="bg-white/[0.06] hover:bg-white/[0.1] text-white"
              >
                Retake Guide
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
