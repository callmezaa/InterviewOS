'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { LintDiagnostic } from '../../lib/lintCode';

interface DiagnosticsPanelProps {
  diagnostics: LintDiagnostic[];
  isOpen: boolean;
  onToggle: () => void;
  onJumpTo: (line: number, column: number) => void;
  onDismiss: (index: number) => void;
}

const SEVERITY_ICONS: Record<string, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const SEVERITY_COLORS: Record<string, string> = {
  error: 'text-red-400',
  warning: 'text-amber-400',
  info: 'text-blue-400',
};

const SEVERITY_BG: Record<string, string> = {
  error: 'bg-red-400/5',
  warning: 'bg-amber-400/5',
  info: 'bg-blue-400/5',
};

export function DiagnosticsPanel({
  diagnostics,
  isOpen,
  onToggle,
  onJumpTo,
  onDismiss,
}: DiagnosticsPanelProps) {
  const counts = useMemo(() => {
    const c = { error: 0, warning: 0, info: 0 };
    diagnostics.forEach((d) => c[d.severity]++);
    return c;
  }, [diagnostics]);

  const sorted = useMemo(
    () =>
      [...diagnostics].sort((a, b) => {
        const sev = { error: 0, warning: 1, info: 2 };
        const diff = sev[a.severity] - sev[b.severity];
        if (diff !== 0) return diff;
        return a.line - b.line;
      }),
    [diagnostics],
  );

  const total = diagnostics.length;

  return (
    <div className="border-t border-white/[0.06] bg-[#0a0a0a] shrink-0">
      {/* Header / Toggle */}
      <button
        onClick={onToggle}
        className="w-full h-7 px-3 flex items-center justify-between text-[11px] text-white/40 hover:text-white/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          {total === 0 ? (
            <span className="flex items-center gap-1.5 text-green-400/50">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400/50" />
              No issues
            </span>
          ) : (
            <>
              {counts.error > 0 && (
                <span className="flex items-center gap-1 text-red-400/70">
                  <AlertCircle className="w-3 h-3" />
                  {counts.error}
                </span>
              )}
              {counts.warning > 0 && (
                <span className="flex items-center gap-1 text-amber-400/70">
                  <AlertTriangle className="w-3 h-3" />
                  {counts.warning}
                </span>
              )}
              {counts.info > 0 && (
                <span className="flex items-center gap-1 text-blue-400/70">
                  <Info className="w-3 h-3" />
                  {counts.info}
                </span>
              )}
              <span className="text-white/30">
                {total} issue{total !== 1 ? 's' : ''}
              </span>
            </>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>

      {/* Diagnostics List */}
      <AnimatePresence>
        {isOpen && total > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="max-h-40 overflow-y-auto">
              {sorted.map((d, idx) => {
                const Icon = SEVERITY_ICONS[d.severity];
                return (
                  <div
                    key={idx}
                    onClick={() => onJumpTo(d.line, d.column)}
                    className={`flex items-start gap-2 px-3 py-1.5 cursor-pointer hover:bg-white/[0.03] transition-colors ${SEVERITY_BG[d.severity]}`}
                  >
                    <Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${SEVERITY_COLORS[d.severity]}`} />
                    <span className="text-[11px] text-white/70 flex-1 min-w-0">
                      <span className="font-mono text-white/40">
                        {d.line}:{d.column}
                      </span>
                      <span className="mx-1.5 text-white/20">&mdash;</span>
                      {d.message}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(idx);
                      }}
                      className="shrink-0 p-0.5 hover:bg-white/[0.06] rounded transition-colors text-white/20 hover:text-white/50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
