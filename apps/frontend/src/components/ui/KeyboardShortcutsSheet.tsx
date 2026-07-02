'use client';

import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { getShortcutsForScope, formatShortcut } from '../../lib/shortcuts';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { ShortcutDef } from '../../lib/shortcuts';

interface KeyboardShortcutsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  scope?: ShortcutDef['scope'];
}

export function KeyboardShortcutsSheet({ isOpen, onClose, scope = 'interview' }: KeyboardShortcutsSheetProps) {
  const sheetRef = useFocusTrap(isOpen);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  const grouped = getShortcutsForScope(scope).reduce<Record<string, ShortcutDef[]>>((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <motion.div
            key="shortcuts-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            ref={sheetRef}
            key="shortcuts-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
            tabIndex={-1}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-[480px] max-h-[80vh] bg-surface-tile-2 border border-white/[0.06] rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
              <h2 className="text-[15px] font-semibold text-white">Keyboard Shortcuts</h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-body-muted/50 hover:text-white hover:bg-white/[0.04] transition-all"
                aria-label="Close shortcuts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {Object.entries(grouped).map(([category, items]) => (
                <div key={category} className="mb-5 last:mb-0">
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-body-muted/40 mb-3">
                    {category}
                  </h3>
                  <div className="space-y-0.5">
                    {items.map((shortcut) => (
                      <div key={shortcut.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-white/[0.02] transition-colors">
                        <span className="text-[13px] text-white/80">{shortcut.description}</span>
                        <kbd className="inline-flex items-center px-2 py-0.5 bg-white/[0.06] border border-white/[0.08] rounded-md text-[11px] font-mono font-semibold text-white/60 leading-none">
                          {formatShortcut(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
