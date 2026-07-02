'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X, Lightbulb, Sparkles, Video, Calendar, Code2, CheckCircle2 } from 'lucide-react';

interface ContextualHintsProps {
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  hasInterviews: boolean;
}

interface Hint {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const HINTS_EMPTY: Record<string, Hint[]> = {
  INTERVIEWER: [
    {
      icon: <Calendar className="w-4 h-4 text-primary-on-dark" />,
      title: 'Schedule your first session',
      description: 'Use the form to create a new interview. Fill in the title, candidate email, and pick a time.',
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-primary-on-dark" />,
      title: 'Prepare interview templates',
      description: 'Create reusable templates for common interview types to save time and ensure consistency.',
    },
    {
      icon: <Sparkles className="w-4 h-4 text-primary-on-dark" />,
      title: 'Enable AI Copilot features',
      description: 'Turn on AI-powered question generation and real-time feedback to enhance interview quality.',
    },
    {
      icon: <CheckCircle2 className="w-4 h-4 text-primary-on-dark" />,
      title: 'Review candidate profiles',
      description: 'Browse candidate profiles and match them to upcoming interview slots based on skills.',
    },
    {
      icon: <Code2 className="w-4 h-4 text-primary-on-dark" />,
      title: 'Set up collaborative workspace',
      description: 'Configure the code editor, whiteboard, and screen sharing before the interview begins.',
    },
    {
      icon: <Video className="w-4 h-4 text-primary-on-dark" />,
      title: 'Test your equipment',
      description: 'Verify your camera, microphone, and speakers are working properly before the session.',
    },
  ],
  CANDIDATE: [
    {
      icon: <Video className="w-4 h-4 text-primary-on-dark" />,
      title: 'Prepare your environment',
      description: 'Find a quiet space with stable internet. Test your camera and microphone before joining.',
    },
    {
      icon: <Calendar className="w-4 h-4 text-primary-on-dark" />,
      title: 'Check your schedule',
      description: 'Review upcoming interviews and ensure you have confirmed your attendance for each session.',
    },
    {
      icon: <Lightbulb className="w-4 h-4 text-primary-on-dark" />,
      title: 'Review technical concepts',
      description: 'Brush up on data structures, algorithms, and system design fundamentals relevant to the role.',
    },
  ],
};

export function ContextualHints({ userRole, hasInterviews }: ContextualHintsProps) {
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const tips = hasInterviews ? [] : HINTS_EMPTY[userRole];

  useEffect(() => {
    if (tips.length > 0 && !dismissed) {
      const timer = setTimeout(() => setOpen(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [dismissed, tips.length]);

  const handleDismiss = () => {
    setDismissed(true);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 left-6 z-50 w-10 h-10 rounded-full bg-primary text-white shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary-focus transition-colors"
        title="Tips & hints"
        aria-label="Toggle tips"
      >
        {open ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {open && tips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-20 left-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-surface-tile-2 border border-white/[0.06] shadow-[0_16px_48px_rgba(0,0,0,0.6)] px-4 py-3 rounded-lg"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary-on-dark" />
                <span className="text-[14px] font-semibold text-white">Tips & hints</span>
              </div>
              {!dismissed && (
                <button
                  onClick={handleDismiss}
                  className="text-[10px] text-body-muted/55 hover:text-body-muted/70 transition-colors font-mono font-semibold"
                >
                  Dismiss all
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3">
              {tips.map((tip, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div className="mt-0.5 shrink-0 w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    {tip.icon}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[13px] font-semibold text-white/90 leading-snug">{tip.title}</span>
                    <span className="text-[12px] text-body-muted/50 leading-relaxed">{tip.description}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full mt-1 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-[12px] font-medium text-body-muted/60 hover:text-white transition-all border border-white/[0.06]"
            >
              Got it
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
