'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SkeletonCard } from '../ui/SkeletonCard';
import { InterviewCard } from './InterviewCard';
import { BulkActionBar } from './BulkActionBar';
import { EmptyStateCard } from './EmptyStateCard';
import { EmptyState } from '../ui/EmptyState';
import { IllustrationSearch } from '../ui/Illustrations';
import { VirtualList } from '../ui/VirtualList';

import type { InterviewDetails } from '../../store/useInterviewStore';

interface InterviewListProps {
  loading: boolean;
  interviews: InterviewDetails[];
  filteredInterviews: InterviewDetails[];
  searchQuery: string;
  statusFilter: string;
  userRole: 'INTERVIEWER' | 'CANDIDATE';
  onSchedule?: () => void;
  onCopyLink: (e: React.MouseEvent, id: string) => void;
  onStartRoom: (id: string) => void;
  onSelectReview: (interview: InterviewDetails) => void;
  copiedId: string | null;
  onClearFilters: () => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkCancel: () => void;
  onBulkCopyLinks: () => void;
  onBulkExportCSV: () => void;
}

export function InterviewList({
  loading, interviews, filteredInterviews,
  searchQuery, statusFilter, userRole, onSchedule,
  onCopyLink, onStartRoom, onSelectReview, copiedId, onClearFilters,
  selectedIds, onToggleSelect, onSelectAll, onDeselectAll,
  onBulkDelete, onBulkCancel, onBulkCopyLinks, onBulkExportCSV,
}: InterviewListProps) {
  if (loading) {
    return <SkeletonCard count={3} />;
  }

  return (
    <AnimatePresence mode="wait">
      {interviews.length === 0 ? (
        <EmptyStateCard
          userRole={userRole}
          onSchedule={onSchedule}
        />
      ) : filteredInterviews.length === 0 ? (
        <EmptyState
          illustration={<IllustrationSearch />}
          title="No matches found"
          description={searchQuery
            ? `No sessions match "${searchQuery}". Try a different search term or status filter.`
            : 'No sessions match the selected status filter. Try a different filter.'}
          action={{ label: 'Clear all filters', onClick: onClearFilters, variant: 'ghost' }}
        />
      ) : (
        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <BulkActionBar
            selectedCount={selectedIds.length}
            totalCount={filteredInterviews.length}
            isAllSelected={selectedIds.length === filteredInterviews.length}
            onSelectAll={onSelectAll}
            onDeselectAll={onDeselectAll}
            onDelete={onBulkDelete}
            onCancel={onBulkCancel}
            onCopyLinks={onBulkCopyLinks}
            onExportCSV={onBulkExportCSV}
          />
          <VirtualList
            items={filteredInterviews}
            className="flex-1 min-h-0"
            estimateSize={100}
            gap={16}
            renderItem={(interview) => (
              <InterviewCard
                interview={interview}
                index={0}
                copiedId={copiedId}
                selected={selectedIds.includes(interview.id)}
                onToggleSelect={() => onToggleSelect(interview.id)}
                onCopyLink={onCopyLink}
                onStartRoom={onStartRoom}
                onSelectReview={onSelectReview}
              />
            )}
          />
        </div>
      )}
    </AnimatePresence>
  );
}
