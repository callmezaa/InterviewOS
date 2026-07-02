'use client';

import React from 'react';
import { Video, Link2, Check, FileText, CalendarPlus, Repeat } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { Checkbox } from '../ui/Checkbox';
import { Tooltip } from '../ui/Tooltip';
import type { InterviewDetails } from '../../store/useInterviewStore';
import { googleCalendarUrl } from '../../lib/calendar';

interface InterviewCardProps {
  interview: InterviewDetails;
  index: number;
  copiedId: string | null;
  selected?: boolean;
  onToggleSelect?: () => void;
  onCopyLink: (e: React.MouseEvent, id: string) => void;
  onStartRoom: (id: string) => void;
  onSelectReview: (interview: InterviewDetails) => void;
}

export function InterviewCard({
  interview, index, copiedId, selected, onToggleSelect,
  onCopyLink, onStartRoom, onSelectReview,
}: InterviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card variant="ghost" className={`p-4 sm:p-6 cursor-pointer transition-all duration-150 ${
        selected ? 'ring-1 ring-primary/40 bg-primary/[0.02]' : ''
      }`}
        onClick={() => onSelectReview(interview)} role="button" tabIndex={0}
        aria-label={`${interview.title} — ${interview.status.toLowerCase()}`}
        onKeyDown={(e) => { if (e.key === 'Enter') onSelectReview(interview); }}>
        <div className="flex items-start md:items-center gap-3 sm:gap-4">
          <div onClick={(e) => e.stopPropagation()} className="pt-0.5 md:pt-0 shrink-0">
            <Checkbox
              checked={!!selected}
              onChange={() => onToggleSelect?.()}
            />
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between flex-1 gap-3 sm:gap-4 min-w-0">
          <div className="flex-1 flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {interview.status === 'ACTIVE' && (
                <span className="flex items-center gap-1.5 text-[11px] text-primary-on-dark bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-pill font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-on-dark opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-on-dark" />
                  </span>
                  Live Room
                </span>
              )}
              {interview.status === 'COMPLETED' && (
                <Badge variant="neutral" dot>Completed</Badge>
              )}
              {interview.status === 'COMPLETED' && interview.feedback?.score !== undefined && (
                <Badge variant={interview.feedback.score >= 80 ? 'success' : interview.feedback.score >= 60 ? 'warning' : 'danger'}>
                  {interview.feedback.score}%
                </Badge>
              )}
              {interview.status === 'SCHEDULED' && (
                <Badge variant="primary" dot dotColor="bg-primary-on-dark/60" className="bg-primary/5 border-primary/15 text-primary-on-dark/60">Scheduled</Badge>
              )}
              {interview.recurringPatternId && interview.instanceNumber && (
                <Badge variant="neutral" className="flex items-center gap-1 bg-white/[0.04] border-white/[0.08] text-body-muted/60">
                  <Repeat className="w-3 h-3" />
                  <span>#{interview.instanceNumber}</span>
                </Badge>
              )}
              <span className="text-[12px] text-body-muted/55 font-mono">
                {new Date(interview.scheduledTime).toLocaleDateString()} @ {new Date(interview.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h4 className="font-display font-semibold text-h4 text-white">
              {interview.title}
            </h4>
            {interview.description && (
              <p className="text-body-muted/50 text-[13px] leading-relaxed">
                {interview.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {interview.status !== 'COMPLETED' && (
              <Tooltip content="Copy invite link to clipboard">
                <button
                  onClick={(e) => onCopyLink(e, interview.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-full border text-[11px] sm:text-[12px] font-medium transition-all duration-300 ${
                    copiedId === interview.id
                      ? 'bg-primary/10 border-primary/20 text-primary-on-dark'
                      : 'bg-white/[0.03] border-white/[0.06] text-body-muted/60 hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white'
                  }`}
                  aria-label={copiedId === interview.id ? 'Link copied' : 'Copy invite link'}
                >
                {copiedId === interview.id ? (
                  <><Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Copied!</span></>
                ) : (
                  <><Link2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden sm:inline">Copy Link</span></>
                )}
                </button>
              </Tooltip>
            )}

            {interview.status === 'SCHEDULED' && (
              <Tooltip content="Add to Google Calendar">
                <a
                  href={googleCalendarUrl({
                    title: interview.title,
                    description: interview.description || '',
                    startTime: new Date(interview.scheduledTime),
                    durationMinutes: 60,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[12px] sm:text-[13px] bg-white/[0.03] border border-white/[0.06] text-body-muted/60 hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-white transition-all"
                  aria-label="Add to Google Calendar"
                >
                  <CalendarPlus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Calendar</span>
                </a>
              </Tooltip>
            )}

            {interview.status !== 'COMPLETED' ? (
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onStartRoom(interview.id);
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[12px] sm:text-[14px]"
                aria-label={interview.status === 'ACTIVE' ? 'Rejoin call room' : 'Enter interview room'}
              >
                <Video className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{interview.status === 'ACTIVE' ? 'Rejoin Call' : 'Enter Room'}</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => onSelectReview(interview)}
                className="flex items-center gap-1 sm:gap-1.5 text-[12px] sm:text-[13px]"
                aria-label="View AI feedback review"
              >
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>View Review</span>
              </Button>
            )}
          </div>
        </div>
        </div>
      </Card>
    </motion.div>
  );
}
