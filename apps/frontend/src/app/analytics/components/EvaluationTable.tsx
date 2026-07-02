'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Table, ArrowUpDown, ExternalLink } from 'lucide-react';
import { AnalyticsData } from '../../../hooks/useAnalyticsData';

interface EvaluationTableProps {
  data: AnalyticsData;
}

const ease = [0.22, 1, 0.36, 1] as const;

type SortKey = 'date' | 'score' | 'technicalRating' | 'communicationRating';
type SortDir = 'asc' | 'desc';

function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  if (score >= 60) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
  return 'text-red-400 bg-red-400/10 border-red-400/20';
}

export function EvaluationTable({ data }: EvaluationTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const hasData = data.evaluations.length > 0;

  const sorted = useMemo(() => {
    return [...data.evaluations].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortKey === 'date') return mul * (new Date(a.date).getTime() - new Date(b.date).getTime());
      return mul * (a[sortKey] - b[sortKey]);
    });
  }, [data.evaluations, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortHeader = ({ label, sortKey: k }: { label: string; sortKey: SortKey }) => (
    <button
      onClick={() => toggleSort(k)}
      className="flex items-center gap-1 text-[11px] font-mono font-semibold text-body-muted/50 hover:text-white/70 transition-colors"
    >
      {label}
      <ArrowUpDown className={`w-3 h-3 ${sortKey === k ? 'text-primary' : ''}`} />
    </button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.3, ease }}
      className="glow-card p-5 sm:p-6"
    >
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Table className="w-3.5 h-3.5 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-[15px] tracking-tight text-white">
          Evaluation History
        </h3>
        <span className="ml-auto text-[11px] font-mono text-body-muted/40">
          {data.evaluations.length} {data.evaluations.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
            <Table className="w-5 h-5 text-white/20" />
          </div>
          <p className="text-[14px] text-white/50 font-medium">No evaluations yet</p>
          <p className="text-[12px] text-body-muted/50 max-w-[280px]">
            Complete interviews with AI evaluation to build your history.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left pb-3 pr-4">
                  <SortHeader label="Interview" sortKey="date" />
                </th>
                <th className="text-left pb-3 pr-4 hidden sm:table-cell">
                  <SortHeader label="Date" sortKey="date" />
                </th>
                <th className="text-right pb-3 pr-4">
                  <SortHeader label="Score" sortKey="score" />
                </th>
                <th className="text-right pb-3 pr-4 hidden md:table-cell">
                  <SortHeader label="Technical" sortKey="technicalRating" />
                </th>
                <th className="text-right pb-3 hidden md:table-cell">
                  <SortHeader label="Communication" sortKey="communicationRating" />
                </th>
                <th className="pb-3 w-8" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.03, ease }}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <span className="text-white/80 text-[13px] font-medium truncate block max-w-[180px] sm:max-w-[240px]">
                      {item.title}
                    </span>
                  </td>
                  <td className="py-3 pr-4 hidden sm:table-cell">
                    <span className="text-body-muted/50 text-[12px] font-mono whitespace-nowrap">
                      {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-bold font-mono border ${scoreBadgeClass(item.score)}`}>
                      {item.score}%
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right hidden md:table-cell">
                    <span className="text-primary font-mono text-[12px] font-semibold">{item.technicalRating.toFixed(1)}</span>
                  </td>
                  <td className="py-3 text-right hidden md:table-cell">
                    <span className="text-amber-400 font-mono text-[12px] font-semibold">{item.communicationRating.toFixed(1)}</span>
                  </td>
                  <td className="py-3 pl-2 text-right">
                    <Link
                      href={`/review/${item.id}`}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-md text-body-muted/40 hover:text-white hover:bg-white/[0.04] transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
