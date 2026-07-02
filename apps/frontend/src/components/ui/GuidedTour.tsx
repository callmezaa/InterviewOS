'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from './Button';

export interface TourStep {
  targetSelector?: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  spotlightPadding?: number;
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  role: 'INTERVIEWER' | 'CANDIDATE';
}

const ease = [0.22, 1, 0.36, 1] as const;

export function GuidedTour({ steps, onComplete, onSkip, role }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const step = steps[currentStep];
  const padding = step?.spotlightPadding ?? 12;

  const updatePosition = useCallback(() => {
    if (!step?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      const tw = 320;
      const gap = 12;
      let left = Math.max(16, Math.min(rect.left + rect.width / 2 - tw / 2, window.innerWidth - tw - 16));
      let top = 0;

      switch (step.placement ?? 'bottom') {
        case 'top':
          top = rect.top - gap;
          break;
        case 'bottom':
          top = rect.bottom + gap;
          break;
        case 'left':
          left = Math.max(16, rect.left - tw - gap);
          top = rect.top + rect.height / 2 - 60;
          break;
        case 'right':
          left = rect.right + gap;
          top = rect.top + rect.height / 2 - 60;
          break;
      }

      top = Math.max(16, Math.min(top, window.innerHeight - 200));
      setTooltipPos({ top, left });
    }
  }, [step]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [updatePosition]);

  const handleNext = () => {
    if (currentStep === steps.length - 1) {
      onComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[9999]"
        style={{ pointerEvents: 'none' }}
      >
        <div className="absolute inset-0 bg-black/50" />

        {targetRect && (
          <div
            className="absolute"
            style={{
              left: targetRect.left - padding,
              top: targetRect.top - padding,
              width: targetRect.width + padding * 2,
              height: targetRect.height + padding * 2,
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.5), 0 0 24px rgba(41,151,255,0.15)',
              borderRadius: '10px',
              zIndex: 1,
            }}
          />
        )}

        {step && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.35, delay: 0.15, ease }}
            className="absolute z-[10000]"
            style={{
              ...(step.targetSelector ? {
                left: tooltipPos.left,
                top: tooltipPos.top,
              } : {
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }),
              pointerEvents: 'auto',
            }}
          >
            <div className="bg-surface-tile-2 border border-white/[0.06] rounded-lg shadow-[0_16px_48px_rgba(0,0,0,0.7)] overflow-hidden min-w-[300px] max-w-[380px]">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary-on-dark" />
                    <span className="text-[10px] font-mono text-body-muted/55">
                      {currentStep + 1} / {steps.length}
                    </span>
                  </div>
                  <button
                    onClick={onSkip}
                    className="flex items-center gap-1 text-[10px] text-body-muted/55 hover:text-white transition-colors font-mono"
                  >
                    <X className="w-3 h-3" />
                    <span>Skip</span>
                  </button>
                </div>

                <h4 className="font-display font-semibold text-[17px] text-white tracking-tight mb-1.5">
                  {step.title}
                </h4>
                <p className="text-[13px] text-body-muted/60 leading-relaxed mb-4">
                  {step.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {steps.map((_, idx) => (
                      <div
                        key={idx}
                        className="rounded-full transition-all duration-300"
                        style={{
                          width: idx === currentStep ? 20 : 6,
                          height: 6,
                          backgroundColor:
                            idx === currentStep
                              ? '#2997FF'
                              : idx < currentStep
                                ? '#2997FF50'
                                : 'rgba(255,255,255,0.12)',
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep > 0 && (
                      <Button
                        variant="secondary"
                        onClick={() => setCurrentStep((s) => s - 1)}
                        className="h-8 px-3 text-[12px]"
                      >
                        <ArrowLeft className="w-3 h-3 mr-1" />
                        Back
                      </Button>
                    )}
                    <Button
                      variant="primary"
                      onClick={handleNext}
                      className="h-8 px-4 text-[12px]"
                    >
                      {currentStep === steps.length - 1 ? 'Done' : 'Next'}
                      {currentStep < steps.length - 1 && <ArrowRight className="w-3 h-3 ml-1" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export const INTERVIEWER_TOUR: TourStep[] = [
  {
    title: 'Welcome to InterviewOS',
    description: 'Let\'s take a quick tour of your dashboard. You\'ll learn where everything lives so you can hit the ground running.',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="schedule-form"]',
    title: 'Schedule Interviews',
    description: 'Use this form to create new interview sessions. Add a title, candidate email, and pick a time — the invite link is auto-generated.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    targetSelector: '[data-tour="interview-list"]',
    title: 'Manage Sessions',
    description: 'All your interviews live here. Filter by status, search by title or candidate, and switch between list and calendar views.',
    placement: 'top',
    spotlightPadding: 8,
  },
  {
    targetSelector: '[data-tour="activity-feed"]',
    title: 'Track Activity',
    description: 'Recent actions appear here — scheduled interviews, completed sessions, and AI feedback generation events.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    title: 'You\'re All Set!',
    description: 'Explore the dashboard at your own pace. When you\'re ready, schedule your first interview or load demo data to see it in action.',
    placement: 'bottom',
  },
];

export const CANDIDATE_TOUR: TourStep[] = [
  {
    title: 'Welcome to InterviewOS',
    description: 'Here\'s your candidate dashboard. Upcoming interviews and session details are just a click away.',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="interview-list"]',
    title: 'Your Interviews',
    description: 'Your scheduled interviews appear here. When it\'s time, click "Enter Room" to join the session.',
    placement: 'top',
    spotlightPadding: 8,
  },
  {
    title: 'You\'re Ready!',
    description: 'When your interviewer starts the session, just click "Enter Room" and you\'ll be connected. Good luck!',
    placement: 'bottom',
  },
];

export const INTERVIEW_ROOM_INTERVIEWER_TOUR: TourStep[] = [
  {
    title: 'Interview Room',
    description: 'This is your live interview workspace. Let\'s walk through the key areas so you can run an effective session.',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="room-video"]',
    title: 'Video & Audio Controls',
    description: 'Your camera feed and microphone controls are here. Toggle them on/off, share your screen, or switch to picture-in-picture mode.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    targetSelector: '[data-tour="room-tabs"]',
    title: 'Workspace Tabs',
    description: 'Switch between the Code Editor, Tests, and Whiteboard. Each tab provides a different tool for the interview.',
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    targetSelector: '[data-tour="room-editor"]',
    title: 'Collaborative Code Editor',
    description: 'Both you and the candidate can write code here in real-time. Select a language, run code, and see output in the console below.',
    placement: 'top',
    spotlightPadding: 8,
  },
  {
    targetSelector: '[data-tour="room-right-panel"]',
    title: 'Side Panel',
    description: 'Access the live transcript, team chat, AI copilot suggestions, and proctoring logs. Toggle this panel on/off anytime.',
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    targetSelector: '[data-tour="room-focus-mode"]',
    title: 'Focus Mode',
    description: 'Strip away distractions to focus on the code. Hides side panels and auxiliary controls — candidates see this by default.',
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    title: 'You\'re Ready!',
    description: 'Use the Evaluate button when the session ends to generate AI-powered feedback. Press ? anytime to see all keyboard shortcuts.',
    placement: 'bottom',
  },
];

export const INTERVIEW_ROOM_CANDIDATE_TOUR: TourStep[] = [
  {
    title: 'Welcome to Your Interview',
    description: 'This is your interview workspace. Let\'s quickly show you where everything is so you can focus on the challenge.',
    placement: 'bottom',
  },
  {
    targetSelector: '[data-tour="room-video"]',
    title: 'Video Feed',
    description: 'Your camera feed is here. Use the controls to toggle your microphone (M) and camera (V) during the session.',
    placement: 'bottom',
    spotlightPadding: 8,
  },
  {
    targetSelector: '[data-tour="room-editor"]',
    title: 'Code Editor',
    description: 'Write your solution here. Select your preferred language from the dropdown and click Run to test your code.',
    placement: 'top',
    spotlightPadding: 8,
  },
  {
    targetSelector: '[data-tour="room-tabs"]',
    title: 'Workspace Tabs',
    description: 'Switch between the Code Editor, Tests panel (to run test cases), and Whiteboard (for diagrams or pseudocode).',
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    targetSelector: '[data-tour="room-focus-mode"]',
    title: 'Focus Mode',
    description: 'You\'re in focus mode by default — a distraction-free view. Toggle it off if you need access to the transcript or chat panel.',
    placement: 'bottom',
    spotlightPadding: 6,
  },
  {
    title: 'Good Luck!',
    description: 'Take your time, read the problem carefully, and test your solution. Press ? anytime to see keyboard shortcuts.',
    placement: 'bottom',
  },
];
