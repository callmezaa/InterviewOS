'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, XCircle, Link2, FileSpreadsheet, X } from 'lucide-react';
import { Checkbox } from '../ui/Checkbox';

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  isAllSelected: boolean;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDelete: () => void;
  onCancel: () => void;
  onCopyLinks: () => void;
  onExportCSV: () => void;
}

export function BulkActionBar({
  selectedCount, totalCount, isAllSelected,
  onSelectAll, onDeselectAll,
  onDelete, onCancel, onCopyLinks, onExportCSV,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-primary/10 border border-primary/20 mb-4">
        <Checkbox
          checked={isAllSelected}
          indeterminate={!isAllSelected && selectedCount > 0}
          onChange={isAllSelected ? onDeselectAll : onSelectAll}
        />

        <span className="text-[13px] font-medium text-white min-w-[100px]">
          {selectedCount} selected
        </span>

        <div className="h-4 w-px bg-white/[0.08]" />

        <div className="flex items-center gap-1.5">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete</span>
          </button>
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md hover:bg-amber-500/20 transition-all"
          >
            <XCircle className="w-3 h-3" />
            <span>Cancel</span>
          </button>
          <button
            onClick={onCopyLinks}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-primary-on-dark bg-primary/10 border border-primary/20 rounded-md hover:bg-primary/20 transition-all"
          >
            <Link2 className="w-3 h-3" />
            <span>Copy Links</span>
          </button>
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20 transition-all"
          >
            <FileSpreadsheet className="w-3 h-3" />
            <span>Export CSV</span>
          </button>
        </div>

        <button
          onClick={onDeselectAll}
          className="ml-auto p-1 rounded-md text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-all"
          aria-label="Deselect all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}
