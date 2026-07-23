'use client';

import React from 'react';
import { CalendarPlus } from 'lucide-react';
import { motion } from 'motion/react';
import { IllustrationEmpty } from '../ui/Illustrations';
import { Card } from '../ui/Card';

interface EmptyStateCardProps {
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  onSchedule?: () => void;
}

export function EmptyStateCard({ userRole, onSchedule }: EmptyStateCardProps) {
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
            ? 'Schedule your first interview session to get started.'
            : 'Your scheduled interviews will appear here once your interviewer invites you.'}
        </p>

        {userRole === 'INTERVIEWER' && (
          <div className="flex flex-col items-center gap-4 w-full max-w-[360px]">
            <motion.button
              onClick={onSchedule}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full rounded-lg bg-primary text-white font-semibold text-[15px] py-3 px-6 hover:bg-primary-focus transition-all duration-200 flex items-center justify-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              Schedule Your First Session
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
