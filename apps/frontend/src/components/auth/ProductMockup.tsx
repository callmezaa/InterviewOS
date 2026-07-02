'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Users, BarChart3, Mic, Monitor, Phone, TrendingUp } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const statItem = {
  hidden: { opacity: 0, x: -6 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.28 + i * 0.07, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ─── Candidate score bar ─────────────────────────────────────────────────── */
function ScoreBar({ value, delay }: { value: number; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      <div className="flex-1 h-[3px] bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary/50 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-[8px] text-white/55 font-mono w-6 text-right">{value}%</span>
    </motion.div>
  );
}

/* ─── Syntax-highlighted code lines ──────────────────────────────────────── */
const CODE_LINES = [
  { w: 60, color: 'bg-primary/25' },
  { w: 82, color: 'bg-white/[0.06]' },
  { w: 45, color: 'bg-white/[0.06]' },
  { w: 90, color: 'bg-primary/15' },
  { w: 70, color: 'bg-white/[0.06]' },
  { w: 55, color: 'bg-emerald-400/20' },
  { w: 88, color: 'bg-white/[0.06]' },
  { w: 38, color: 'bg-white/[0.06]' },
  { w: 72, color: 'bg-primary/10' },
  { w: 50, color: 'bg-white/[0.06]' },
  { w: 65, color: 'bg-emerald-400/15' },
  { w: 30, color: 'bg-white/[0.06]' },
];

export function ProductMockup() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full rounded-lg overflow-hidden relative"
      style={{
        background: 'rgba(20,20,22,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 20px 60px -16px rgba(0,0,0,0.8)',
      }}
    >
      {/* Top-edge highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent pointer-events-none" />

      {/* Title bar */}
      <div className="h-7 flex items-center gap-2 px-3 border-b border-white/[0.06]"
        style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="flex gap-1">
          <span className="w-[7px] h-[7px] rounded-full bg-red-500/50" />
          <span className="w-[7px] h-[7px] rounded-full bg-yellow-500/50" />
          <span className="w-[7px] h-[7px] rounded-full bg-emerald-500/50" />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[9px] text-white/20 font-mono">InterviewOS · Session #1247</span>
        </div>
        <motion.span
          className="w-[6px] h-[6px] rounded-full bg-emerald-400 mr-1"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Canvas */}
      <div className="p-3 flex flex-col gap-2.5">

        {/* Main row: video + code */}
        <div className="flex gap-2.5">

          {/* Video panel */}
          <div
            className="flex-1 rounded-md relative overflow-hidden"
            style={{
              aspectRatio: '16/9',
              background: 'rgba(0,0,0,0.5)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-primary-on-dark/[0.02]"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.06] flex items-center justify-center">
                <Users className="w-4 h-4 text-white/50" />
              </div>
              <span className="text-[9px] text-white/20 font-medium">Live Interview</span>
            </div>
            {/* Name tag */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 rounded px-2 py-0.5">
              <motion.span
                className="w-[5px] h-[5px] rounded-full bg-emerald-400 shrink-0"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[8px] text-white/55 font-medium">Sarah K. · Candidate</span>
            </div>
            {/* REC badge */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500/30 border border-red-500/20 rounded-sm px-1.5 py-0.5">
              <span className="w-[4px] h-[4px] rounded-full bg-red-400" />
              <span className="text-[7px] text-red-300/80 font-mono">REC</span>
            </div>
          </div>

          {/* Code editor panel */}
          <div
            className="w-[120px] rounded-md p-2.5 flex flex-col gap-1.5"
            style={{
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Tab bar */}
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[7px] text-primary/55 font-mono border-b border-primary/25 pb-px">solution.ts</span>
              <span className="text-[7px] text-white/15 font-mono">utils.ts</span>
            </div>
            {/* Code lines */}
            <div className="flex flex-col gap-0.5">
              {CODE_LINES.map((line, i) => (
                <div
                  key={i}
                  className={`h-[3.5px] rounded-[1.5px] ${line.color}`}
                  style={{ width: `${line.w}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Candidate score bars */}
        <div
          className="rounded-md p-2.5 flex flex-col gap-1.5"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-white/50 flex items-center gap-1">
              <TrendingUp className="w-2 h-2" /> Evaluation Progress
            </span>
            <span className="text-[8px] text-primary/50 font-mono">Live</span>
          </div>
          <ScoreBar value={87} delay={0.4} />
          <ScoreBar value={72} delay={0.46} />
          <ScoreBar value={94} delay={0.52} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: BarChart3, label: 'Avg. Score', value: '87%' },
            { icon: Clock, label: 'Duration', value: '42m' },
            { icon: CheckCircle, label: 'Completed', value: '12' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={statItem}
              initial="hidden"
              animate="visible"
              className="rounded-md p-2 flex flex-col gap-[3px]"
              style={{
                background: 'rgba(0,0,0,0.18)',
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <span className="text-[7px] text-white/25">{stat.label}</span>
              <div className="flex items-center gap-1">
                <stat.icon className="w-2 h-2 text-primary/45" />
                <span className="text-[11px] text-white/75 font-semibold tracking-tight">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Controls */}
        <motion.div
          className="flex items-center justify-center gap-2 rounded-md py-1.5"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65, duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'rgba(0,0,0,0.18)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          {[
            { icon: Mic, label: 'Mute', active: true, danger: false },
            { icon: Monitor, label: 'Share', active: true, danger: false },
            { icon: Phone, label: 'End', active: false, danger: true },
          ].map((btn) => (
            <div
              key={btn.label}
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-200 ${
                btn.danger
                  ? 'bg-red-500/50 hover:bg-red-500/70'
                  : 'bg-white/[0.06] hover:bg-white/[0.10]'
              }`}
            >
              <btn.icon
                className={`w-[10px] h-[10px] ${btn.danger ? 'text-white/80' : 'text-white/45'}`}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
