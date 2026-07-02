'use client';

import React from 'react';
import { Loader2, FlaskConical, Award, Sparkles, Code2, MessageSquare, CalendarPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { IllustrationEmpty } from '../ui/Illustrations';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';

interface EmptyStateCardProps {
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  demoLoading: boolean;
  onLoadDemo: () => void;
  onSchedule?: () => void;
}

export function EmptyStateCard({ userRole, demoLoading, onLoadDemo, onSchedule }: EmptyStateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="ghost" className="flex flex-col items-center justify-center p-10 md:p-12 text-center relative overflow-hidden">
        <div className="w-[160px] h-[106px] mb-6 relative flex items-center justify-center select-none pointer-events-none text-primary-on-dark/20">
          <IllustrationEmpty className="w-full h-full" />
        </div>

        <h4 className="font-display font-semibold text-h3 text-white mb-2">
          No sessions yet
        </h4>
        <p className="text-[13px] text-body-muted/45 leading-relaxed max-w-[300px] mx-auto mb-8">
          {userRole === 'INTERVIEWER'
            ? 'Schedule your first interview session to get started, or load demo data to explore the full platform experience.'
            : 'Your scheduled interviews will appear here once your interviewer invites you.'}
        </p>

        {userRole === 'INTERVIEWER' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[360px]">
            <motion.button
              onClick={onSchedule}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full rounded-lg bg-primary text-white font-semibold text-[15px] py-3 px-6 hover:bg-primary-focus transition-all duration-200 shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              Schedule Your First Session
            </motion.button>

            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[10px] font-mono font-semibold text-body-muted/25">or try a demo</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
            </div>

            <motion.button
              onClick={onLoadDemo}
              disabled={demoLoading}
              whileHover={{ scale: demoLoading ? 1 : 1.01 }}
              whileTap={{ scale: demoLoading ? 1 : 0.99 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="group relative w-full rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 p-5 text-left overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />

              <div className="relative z-10 flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center">
                  {demoLoading ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <FlaskConical className="w-5 h-5 text-primary" />
                  )}
                </div>

                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[15px] font-semibold text-white tracking-tight">
                      {demoLoading ? 'Setting up demo...' : 'Quick Demo Setup'}
                    </span>
                    {!demoLoading && (
                      <Badge variant="primary" size="sm">Free</Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-body-muted/45 leading-relaxed">
                    {demoLoading
                      ? 'Generating 6 realistic interview sessions with AI feedback scores...'
                      : 'Instantly populate 6 realistic sessions — active, scheduled, and completed with AI scores.'}
                  </p>

                  {!demoLoading && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      {[
                        { icon: <Code2 className="w-2.5 h-2.5" />, label: 'Code History' },
                        { icon: <MessageSquare className="w-2.5 h-2.5" />, label: 'Transcripts' },
                        { icon: <Award className="w-2.5 h-2.5" />, label: 'AI Scores' },
                        { icon: <Sparkles className="w-2.5 h-2.5" />, label: '6 Sessions' },
                      ].map(({ icon, label }) => (
                        <Badge key={label} variant="neutral" size="sm">
                          {icon}
                          {label}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {demoLoading && (
                <motion.div
                  className="absolute bottom-0 left-0 h-[2px] bg-primary/60"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.3, ease: 'easeInOut' }}
                />
              )}
            </motion.button>
          </div>
        )}

        {userRole === 'CANDIDATE' && (
          <div className="flex flex-col items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 text-[12px] text-body-muted/50">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-on-dark/40" />
              <span>You will be notified when an interview is scheduled</span>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
