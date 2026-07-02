'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CalendarPlus, Share2, ArrowRight, X, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface OnboardingModalProps {
  userName: string;
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  onComplete: () => void;
}

const INTERVIEWER_STEPS = [
  {
    badge: 'Getting Started',
    icon: Terminal,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    accentColor: '#2997FF',
    title: (name: string) => `Welcome, ${name.split(' ')[0]} 👋`,
    description:
      'InterviewOS is your command center for running world-class technical interviews — real-time WebRTC collaboration, live code sandboxes, AI evaluation, and session recording, all in one cinematic workspace.',
    illustration: (
      <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="20" y="20" width="200" height="100" rx="10" stroke="rgba(41,151,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="80" cy="70" r="22" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" />
        <circle cx="80" cy="70" r="8" fill="rgba(41,151,255,0.6)" />
        <circle cx="160" cy="70" r="22" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" />
        <circle cx="160" cy="70" r="8" fill="rgba(41,151,255,0.6)" />
        <path d="M102 70 L138 70" stroke="rgba(41,151,255,0.5)" strokeWidth="2" strokeDasharray="3 3" />
        <path d="M116 58 L124 70 L116 82" stroke="rgba(41,151,255,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M36 36 L28 36 L28 28" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M204 36 L212 36 L212 28" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M36 104 L28 104 L28 112" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M204 104 L212 104 L212 112" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="80" cy="70" r="36" stroke="rgba(41,151,255,0.08)" strokeWidth="1" />
      </svg>
    ),
    cta: "Let's begin →",
  },
  {
    badge: 'Step 1 of 2',
    icon: CalendarPlus,
    iconColor: 'text-primary-on-dark',
    iconBg: 'bg-primary/10 border-primary/20',
    accentColor: '#2997FF',
    title: () => 'What to Expect',
    description:
      'Once your interviewer starts the room, you\'ll collaborate live in a shared code editor, discuss problems via video, and have your responses transcribed in real-time by AI. Give it your best — everything is recorded.',
    illustration: (
      <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="30" y="20" width="180" height="100" rx="8" stroke="rgba(41,151,255,0.25)" strokeWidth="1.5" />
        <rect x="30" y="20" width="180" height="26" rx="8" fill="rgba(41,151,255,0.07)" />
        <rect x="46" y="59" width="60" height="48" rx="4" fill="rgba(41,151,255,0.08)" stroke="rgba(41,151,255,0.2)" strokeWidth="1" />
        <rect x="118" y="59" width="80" height="48" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <rect x="124" y="67" width="68" height="4" rx="2" fill="rgba(255,255,255,0.08)" />
        <rect x="124" y="77" width="50" height="4" rx="2" fill="rgba(41,151,255,0.3)" />
        <rect x="124" y="87" width="62" height="4" rx="2" fill="rgba(255,255,255,0.06)" />
        <rect x="124" y="97" width="40" height="4" rx="2" fill="rgba(41,151,255,0.2)" />
        <circle cx="76" cy="83" r="14" fill="rgba(41,151,255,0.15)" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" />
        <path d="M72 83 L76 87 L82 77" stroke="rgba(41,151,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    cta: 'Ready to go',
  },
];

const CANDIDATE_STEPS = [
  {
    badge: 'Getting Started',
    icon: Terminal,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/10 border-primary/20',
    accentColor: '#2997FF',
    title: (name: string) => `Welcome, ${name.split(' ')[0]}`,
    description:
      'Welcome to InterviewOS. You\'ll collaborate in a shared code editor, discuss problems via video, and get real-time AI feedback.',
    illustration: (
      <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="20" y="20" width="200" height="100" rx="10" stroke="rgba(41,151,255,0.25)" strokeWidth="1.5" strokeDasharray="4 4" />
        <circle cx="80" cy="70" r="22" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" />
        <circle cx="80" cy="70" r="8" fill="rgba(41,151,255,0.6)" />
        <circle cx="160" cy="70" r="22" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" />
        <circle cx="160" cy="70" r="8" fill="rgba(41,151,255,0.6)" />
        <path d="M102 70 L138 70" stroke="rgba(41,151,255,0.5)" strokeWidth="2" strokeDasharray="3 3" />
      </svg>
    ),
    cta: 'Get started',
  },
  {
    badge: 'What to Expect',
    icon: CalendarPlus,
    iconColor: 'text-primary-on-dark',
    iconBg: 'bg-primary/10 border-primary/20',
    accentColor: '#2997FF',
    title: () => 'What to Expect',
    description:
      'Once the interviewer starts the session, you\'ll collaborate on coding challenges, discuss solutions, and receive real-time AI-powered guidance.',
    illustration: (
      <svg viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <rect x="30" y="20" width="180" height="100" rx="8" stroke="rgba(41,151,255,0.25)" strokeWidth="1.5" />
        <rect x="46" y="59" width="60" height="48" rx="4" fill="rgba(41,151,255,0.08)" stroke="rgba(41,151,255,0.2)" strokeWidth="1" />
        <rect x="118" y="59" width="80" height="48" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <circle cx="76" cy="83" r="14" fill="rgba(41,151,255,0.15)" stroke="rgba(41,151,255,0.3)" strokeWidth="1.5" />
      </svg>
    ),
    cta: 'Ready',
  },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 48 : -48,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.32, ease: EASE },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -48 : 48,
    opacity: 0,
    transition: { duration: 0.22, ease: EASE },
  }),
};

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  userName,
  userRole,
  onComplete,
}) => {
  const steps = userRole === 'INTERVIEWER' ? INTERVIEWER_STEPS : CANDIDATE_STEPS;
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const Icon = step.icon;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[520px] bg-surface-tile-2 border border-white/[0.06] rounded-lg shadow-[0_24px_64px_rgba(0,0,0,0.7)] overflow-hidden"
      >
        {/* Glow accent top border */}
        <div
          className="h-[2px] w-full"
          style={{
            background: `linear-gradient(90deg, transparent, ${step.accentColor}60, transparent)`,
          }}
        />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-2 flex items-center justify-between">
          {/* Badge */}
          <span
            className="text-[10px] font-semibold tracking-tight px-2.5 py-1 rounded-pill border"
            style={{
              color: step.accentColor,
              borderColor: `${step.accentColor}35`,
              backgroundColor: `${step.accentColor}12`,
            }}
          >
            {step.badge}
          </span>

          {/* Skip */}
          <button
            onClick={onComplete}
            className="flex items-center gap-1 text-[11px] text-body-muted/55 hover:text-body-muted/70 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Skip</span>
          </button>
        </div>

        {/* Animated Step Content */}
        <div className="px-6 py-4 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex flex-col gap-5"
            >
              {/* Illustration */}
              <div className="w-full h-[130px] flex items-center justify-center opacity-90">
                {step.illustration}
              </div>

              {/* Icon + Text */}
              <div className="flex flex-col gap-3">
                <div className={`self-start p-2.5 rounded-lg border ${step.iconBg}`}>
                  <Icon className={`w-5 h-5 ${step.iconColor}`} />
                </div>

                <h3 id="onboarding-title" className="font-display font-semibold text-h3 text-white leading-snug">
                  {step.title(userName)}
                </h3>

                <p className="text-[13px] text-body-muted/60 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer: Progress dots + CTA */}
        <div className="px-6 pb-6 pt-2 flex items-center justify-between">
          {/* Step Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Go to step ${idx + 1}`}
                onClick={() => {
                  if (idx < currentStep) {
                    setDirection(-1);
                    setCurrentStep(idx);
                  } else if (idx > currentStep) {
                    setDirection(1);
                    setCurrentStep(idx);
                  }
                }}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: idx === currentStep ? '20px' : '6px',
                  height: '6px',
                  backgroundColor:
                    idx === currentStep
                      ? step.accentColor
                      : idx < currentStep
                      ? `${step.accentColor}50`
                      : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>

          {/* CTA Button */}
          <Button
            variant="primary"
            onClick={handleNext}
            className="flex items-center gap-2 px-5 py-2 text-[13px]"
            style={{ backgroundColor: step.accentColor }}
          >
            <span>{step.cta}</span>
            {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
