'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Code2, Clock, CheckCircle2, TrendingUp } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function ScoreBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-2"
      custom={delay}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <span className="text-[10px] text-white/55 w-16 shrink-0 truncate">{label}</span>
      <div className="flex-1 min-w-0 h-[4px] bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary/40"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-[10px] text-white/55 font-mono w-7 text-right shrink-0">{value}%</span>
    </motion.div>
  );
}

export function ProductPreview() {
  return (
    <motion.div
      className="w-full rounded-lg overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 16px 32px -8px rgba(0,0,0,0.35)',
      }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Title bar */}
      <div
        className="h-7 flex items-center gap-2 px-3 border-b border-white/[0.06] shrink-0"
        style={{ background: 'rgba(0,0,0,0.3)' }}
      >
        <div className="flex gap-1">
          <span className="w-[6px] h-[6px] rounded-full bg-white/[0.08]" />
          <span className="w-[6px] h-[6px] rounded-full bg-white/[0.08]" />
          <span className="w-[6px] h-[6px] rounded-full bg-white/[0.08]" />
        </div>
        <div className="flex-1 text-center min-w-0">
          <span className="text-[9px] text-white/20 font-mono truncate">InterviewOS · Session</span>
        </div>
        <motion.span
          className="w-[4px] h-[4px] rounded-full bg-emerald-400 shrink-0"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Content */}
      <div className="p-2.5 space-y-2">
        {/* Video + Code row */}
        <div className="flex gap-2 min-h-0">
          {/* Video panel */}
          <div
            className="flex-1 min-w-0 rounded-md relative overflow-hidden"
            style={{
              aspectRatio: '16/10',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <Users className="w-3.5 h-3.5 text-white/25" />
              </div>
            </div>
            <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1 bg-black/50 rounded px-1.5 py-0.5">
              <motion.span
                className="w-[3px] h-[3px] rounded-full bg-emerald-400"
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-[8px] text-white/45 font-medium">Sarah K.</span>
            </div>
          </div>

          {/* Code panel */}
          <div
            className="w-[30%] min-w-[60px] shrink-0 rounded-md p-2"
            style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.03)',
            }}
          >
            <div className="flex items-center gap-1 mb-1.5">
              <Code2 className="w-2 h-2 text-primary/40" />
              <span className="text-[7px] text-primary/50 font-mono truncate">solution.ts</span>
            </div>
            <div className="space-y-[2px]">
              {[65, 85, 45, 90, 70, 55, 80].map((w, i) => (
                <div
                  key={i}
                  className={`h-[2.5px] rounded-[1px] ${i === 0 || i === 3 ? 'bg-primary/20' : 'bg-white/[0.05]'}`}
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Score bars */}
        <div
          className="rounded-md p-2 space-y-1.5"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid rgba(255,255,255,0.02)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <TrendingUp className="w-2 h-2 text-primary/40" />
            <span className="text-[8px] text-white/50">Evaluation</span>
          </div>
          <ScoreBar label="Technical" value={87} delay={0.5} />
          <ScoreBar label="Communication" value={72} delay={0.56} />
          <ScoreBar label="Problem Solving" value={94} delay={0.62} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { icon: CheckCircle2, label: 'Score', value: '87%' },
            { icon: Clock, label: 'Duration', value: '42m' },
            { icon: TrendingUp, label: 'Passed', value: '12' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="rounded-md p-1.5"
              style={{
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.03)',
              }}
              custom={0.7 + i * 0.05}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <span className="text-[7px] text-white/25 block">{stat.label}</span>
              <div className="flex items-center gap-0.5 mt-0.5">
                <stat.icon className="w-2 h-2 text-primary/40" />
                <span className="text-[11px] text-white/65 font-semibold">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
