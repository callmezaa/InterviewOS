'use client';

import React, { useMemo, useState, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { IlustrationCalendar } from '../ui/Illustrations';
import { Tooltip } from '../ui/Tooltip';
import type { InterviewDetails } from '../../store/useInterviewStore';

interface CalendarViewProps {
  interviews: InterviewDetails[];
  calendarDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectInterview: (interview: InterviewDetails) => void;
  onReschedule?: (interviewId: string, newDate: Date, originalDate: Date) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function getDaysInMonth(date: Date): (Date | null)[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(new Date(year, month, d));
  return days;
}

export function CalendarView({
  interviews, calendarDate, onPrevMonth, onNextMonth, onSelectInterview, onReschedule,
}: CalendarViewProps) {
  const days = useMemo(() => getDaysInMonth(calendarDate), [calendarDate]);
  const monthInterviews = useMemo(
    () => interviews.filter((int) => {
      const d = new Date(int.scheduledTime);
      return d.getMonth() === calendarDate.getMonth() && d.getFullYear() === calendarDate.getFullYear();
    }),
    [interviews, calendarDate],
  );
  const hasInterviews = monthInterviews.length > 0;

  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragItem = useRef<{ id: string; originalDate: string } | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, int: InterviewDetails) => {
    dragItem.current = { id: int.id, originalDate: int.scheduledTime };
    setDraggedId(int.id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragItem.current));

    const ghost = e.currentTarget.cloneNode(true) as HTMLElement;
    ghost.style.position = 'absolute';
    ghost.style.top = '-1000px';
    ghost.style.opacity = '0.7';
    ghost.style.borderRadius = '6px';
    ghost.style.padding = '4px 8px';
    ghost.style.background = 'var(--color-primary-glow)';
    ghost.style.border = '1px solid var(--color-primary-glow)';
    ghost.style.fontSize = '10px';
    ghost.style.color = 'var(--color-white)';
    ghost.style.pointerEvents = 'none';
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, 0, 0);
    setTimeout(() => document.body.removeChild(ghost), 0);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDate !== dayStr) setDragOverDate(dayStr);
  }, [dragOverDate]);

  const handleDragLeave = useCallback(() => {
    setDragOverDate(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDay: Date) => {
    e.preventDefault();
    setDragOverDate(null);
    setDraggedId(null);

    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { id: string; originalDate: string };
      const originalDate = new Date(parsed.originalDate);
      if (isNaN(originalDate.getTime()) || isNaN(targetDay.getTime())) return;

      if (originalDate.toDateString() === targetDay.toDateString()) return;

      const [h, m] = [
        originalDate.getHours(),
        originalDate.getMinutes(),
      ];
      const target = new Date(targetDay);
      target.setHours(h, m, 0, 0);

      onReschedule?.(parsed.id, target, originalDate);
    } catch {
      // ignore
    }
  }, [onReschedule]);

  const handleDragEnd = useCallback(() => {
    setDragOverDate(null);
    setDraggedId(null);
    dragItem.current = null;
  }, []);

  return (
    <div className="flex flex-col bg-surface-tile-2 border border-white/[0.06] rounded-lg p-6 gap-4 w-full">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <h4 className="font-display font-semibold text-[17px] text-white">
          {MONTHS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
        </h4>
        <div className="flex items-center gap-2">
          <Tooltip content="Previous month">
            <button
              onClick={onPrevMonth}
              type="button"
              className="p-1.5 rounded-lg text-body-muted/65 hover:text-white hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200 active:scale-95"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </Tooltip>
          <Tooltip content="Next month">
            <button
              onClick={onNextMonth}
              type="button"
              className="p-1.5 rounded-lg text-body-muted/65 hover:text-white hover:bg-white/[0.04] border border-white/[0.06] transition-all duration-200 active:scale-95"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-semibold tracking-tight text-body-muted/55 font-mono min-w-[560px] select-none">
        <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div>
        <div>Thu</div><div>Fri</div><div>Sat</div>
      </div>

      <div className="overflow-x-auto -mx-2 px-2 pb-1 select-none">
        <div className="grid grid-cols-7 gap-2 min-h-[300px] min-w-[560px] relative">
          {!hasInterviews && !draggedId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 pointer-events-none"
            >
              <div className="w-[100px] h-[72px] text-white/12 select-none pointer-events-none hidden sm:block">
                <IlustrationCalendar className="w-full h-full" />
              </div>
              <div className="flex flex-col gap-1 text-center">
                <p className="text-[15px] font-display font-semibold text-white/55 tracking-tight">No interviews this month</p>
                <p className="text-[12px] text-body-muted/25 max-w-[220px] leading-relaxed hidden sm:block">
                  Schedule sessions to see them on the calendar.
                </p>
              </div>
            </motion.div>
          )}
          {days.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="bg-white/[0.002] rounded-lg min-h-[70px]" />;
            }

            const isToday = new Date().toDateString() === day.toDateString();
            const dayStr = day.toISOString();
            const isOver = dragOverDate === dayStr;
            const dateInterviews = interviews.filter((int) => {
              const intDate = new Date(int.scheduledTime);
              return intDate.toDateString() === day.toDateString();
            });

            return (
              <div
                key={dayStr}
                onDragOver={(e) => handleDragOver(e, dayStr)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
                className={`bg-white/[0.01] border rounded-lg p-1 sm:p-2 min-h-[75px] sm:min-h-[85px] flex flex-col gap-1 transition-all duration-150 ${
                  isToday
                    ? 'border-primary bg-primary/5'
                    : isOver
                      ? 'border-primary/40 bg-primary/8 shadow-[inset_0_0_0_1px_var(--color-primary-glow)]'
                      : 'border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02]'
                }`}
              >
                <span className={`text-[11px] font-bold font-mono ${isToday ? 'text-primary' : 'text-body-muted/50'}`}>
                  {day.getDate()}
                </span>

                <div className="flex flex-col gap-0.5 sm:gap-1 overflow-y-auto max-h-[70px]">
                  {dateInterviews.slice(0, 2).map((int) => {
                    const timeStr = new Date(int.scheduledTime).toLocaleTimeString([], {
                      hour: '2-digit', minute: '2-digit',
                    });
                    const isDragging = draggedId === int.id;
                    return (
                      <button
                        key={int.id}
                        draggable={int.status === 'SCHEDULED'}
                        onDragStart={(e) => handleDragStart(e, int)}
                        onDragEnd={handleDragEnd}
                        onClick={() => onSelectInterview(int)}
                        className={`text-left text-[8px] sm:text-[9px] truncate px-0.5 sm:px-1 py-0.5 rounded-md font-sans flex flex-col leading-tight border transition-all duration-150 ${
                          int.status === 'COMPLETED'
                            ? 'bg-white/[0.06] border-white/[0.1] text-white/60'
                            : int.status === 'ACTIVE'
                              ? 'bg-primary/10 border-primary/20 text-primary-on-dark'
                              : 'bg-primary/5 border-primary/15 text-primary-on-dark/60'
                        } ${
                          isDragging
                            ? 'opacity-30 scale-95'
                            : 'cursor-pointer'
                        } ${
                          int.status === 'SCHEDULED' && !isDragging
                            ? 'cursor-grab active:cursor-grabbing'
                            : ''
                        }`}
                        title={`${timeStr} - ${int.title}${int.status === 'SCHEDULED' ? ' (drag to reschedule)' : ''}`}
                      >
                        <span className="font-semibold opacity-75 font-mono hidden sm:inline text-[8px]">{timeStr}</span>
                        <span className="truncate">{int.title}</span>
                      </button>
                    );
                  })}
                  {dateInterviews.length > 2 && (
                    <span className="text-[8px] text-body-muted/55 font-mono text-center">
                      +{dateInterviews.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
