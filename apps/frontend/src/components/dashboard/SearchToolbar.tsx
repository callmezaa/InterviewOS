'use client';

import React from 'react';
import { List, Calendar, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hoverScale } from '../../lib/motion';
import { Tooltip } from '../ui/Tooltip';

interface SearchToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED';
  onStatusFilterChange: (filter: 'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED') => void;
  dashboardView: 'list' | 'calendar';
  onViewChange: (view: 'list' | 'calendar') => void;
  onRefresh: () => void;
  interviewCounts: { ALL: number; ACTIVE: number; SCHEDULED: number; COMPLETED: number };
}

export function SearchToolbar({
  searchQuery, onSearchChange,
  statusFilter, onStatusFilterChange,
  dashboardView, onViewChange, onRefresh,
  interviewCounts,
}: SearchToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white/[0.02] border border-white/[0.06] rounded-full p-0.5 flex-shrink-0">
          <Tooltip content="List view" shortcut="V" side="bottom">
            <motion.button
              onClick={() => onViewChange('list')}
              className={`px-3 py-1 rounded-pill text-[12px] font-semibold transition-all flex items-center gap-1 ${
                dashboardView === 'list' ? 'bg-primary text-white' : 'text-body-muted/50 hover:text-white'
              }`}
              {...hoverScale}
              aria-label="List view"
              aria-pressed={dashboardView === 'list'}
              role="tab"
            >
              <List className="w-3 h-3" />
              <span>List</span>
            </motion.button>
          </Tooltip>
          <Tooltip content="Calendar view" shortcut="V" side="bottom">
            <motion.button
              onClick={() => onViewChange('calendar')}
              className={`px-3 py-1 rounded-pill text-[12px] font-semibold transition-all flex items-center gap-1 ${
                dashboardView === 'calendar' ? 'bg-primary text-white' : 'text-body-muted/50 hover:text-white'
              }`}
              {...hoverScale}
              aria-label="Calendar view"
              aria-pressed={dashboardView === 'calendar'}
              role="tab"
            >
              <Calendar className="w-3 h-3" />
              <span>Calendar</span>
            </motion.button>
          </Tooltip>
        </div>

        <Tooltip content="Refresh interviews list" shortcut="R">
          <button
            onClick={onRefresh}
            className="p-2 hover:bg-white/[0.04] border border-white/[0.06] rounded-pill active:scale-95 transition-all text-body-muted/60 hover:text-white flex-shrink-0"
            aria-label="Refresh interviews"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>

      <AnimatePresence>
        {dashboardView === 'list' && (
          <motion.div
            key="filter-pills"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2 overflow-x-auto pb-0.5"
          >
            {(['ALL', 'ACTIVE', 'SCHEDULED', 'COMPLETED'] as const).map((filter, i) => {
              const isActive = statusFilter === filter;
              const activeStyles = {
                ALL: 'bg-white/[0.08] border-white/[0.12] text-white',
                ACTIVE: 'bg-primary/15 border-primary/30 text-primary-on-dark',
                SCHEDULED: 'bg-primary/10 border-primary/25 text-primary-on-dark',
                COMPLETED: 'bg-white/[0.06] border-white/[0.1] text-white',
              };
              const filterLabel = filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase();
              return (
                <Tooltip key={filter} content={`${filterLabel} interviews`} shortcut={String(i + 1)} side="bottom">
                  <motion.button
                    onClick={() => onStatusFilterChange(filter)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-pill border text-[11px] font-semibold transition-all duration-200 ${
                      isActive ? activeStyles[filter] : 'border-white/[0.06] text-body-muted/55 hover:text-white/70 hover:border-white/[0.1]'
                    }`}
                    {...hoverScale}
                    aria-label={`Filter by ${filter === 'ALL' ? 'all statuses' : filter.toLowerCase()}`}
                    aria-pressed={isActive}
                  >
                    <span>{filterLabel}</span>
                    <span className="text-[10px] opacity-60 font-mono">{interviewCounts[filter]}</span>
                  </motion.button>
                </Tooltip>
              );
            })}

            <AnimatePresence>
              {(searchQuery || statusFilter !== 'ALL') && (
                <motion.button
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -4 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => { onSearchChange(''); onStatusFilterChange('ALL'); }}
                  className="ml-auto flex items-center gap-1 text-[11px] text-body-muted/55 hover:text-white/60 transition-colors"
                >
                  <X className="w-3 h-3" />
                  <span>Clear</span>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
