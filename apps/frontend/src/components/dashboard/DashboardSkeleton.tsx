'use client';

import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

function MetricSkeleton() {
  return (
    <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-surface-tile-1/40 p-4 flex flex-col gap-3`}>
      <div className="flex items-start justify-between gap-2">
        <Pulse className="w-9 h-9 rounded-lg bg-white/[0.05]" />
        <Pulse className="w-14 h-4 rounded-full bg-white/[0.04]" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Pulse className="w-20 h-3 bg-white/[0.04]" />
        <Pulse className="w-28 h-7 bg-white/[0.07] rounded-md" />
        <Pulse className="w-24 h-3 bg-white/[0.03]" />
      </div>
      <Pulse className="w-full h-[3px] rounded-full bg-white/[0.04]" />
    </div>
  );
}

function InterviewCardSkeleton() {
  return (
    <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-surface-tile-1/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4`}>
      <div className="flex-1 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Pulse className="h-5 w-16 rounded-pill bg-white/[0.05]" />
          <Pulse className="h-4 w-28 bg-white/[0.03] rounded" />
        </div>
        <Pulse className="h-5 w-2/3 bg-white/[0.06] rounded-md" />
        <div className="flex items-center gap-4">
          <Pulse className="h-3 w-32 bg-white/[0.03] rounded" />
          <Pulse className="h-3 w-24 bg-white/[0.03] rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Pulse className="h-8 w-20 rounded-pill bg-white/[0.04] border border-white/[0.06]" />
        <Pulse className="h-8 w-28 rounded-pill bg-white/[0.07]" />
      </div>
    </div>
  );
}

function ScheduleFormSkeleton() {
  return (
    <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-surface-tile-1/40 p-5 flex flex-col gap-4`}>
      <div className="flex items-center gap-2">
        <Pulse className="w-8 h-8 rounded-lg bg-white/[0.05]" />
        <div className="flex flex-col gap-1">
          <Pulse className="w-28 h-4 bg-white/[0.06] rounded-md" />
          <Pulse className="w-20 h-3 bg-white/[0.03]" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <Pulse className="w-full h-9 rounded-pill bg-white/[0.04]" />
        <Pulse className="w-full h-20 rounded-lg bg-white/[0.04]" />
        <Pulse className="w-full h-9 rounded-pill bg-white/[0.04]" />
        <Pulse className="w-full h-9 rounded-pill bg-white/[0.04]" />
        <Pulse className="w-full h-9 rounded-pill bg-white/[0.07]" />
      </div>
    </div>
  );
}

function ActivityFeedSkeleton() {
  return (
    <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-surface-tile-1/40 p-5 flex flex-col gap-4`}>
      <div className="flex items-center justify-between">
        <Pulse className="w-24 h-4 bg-white/[0.06] rounded-md" />
        <Pulse className="w-12 h-3 bg-white/[0.03]" />
      </div>
      <div className="flex flex-col gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <Pulse className="w-6 h-6 rounded-full bg-white/[0.04] shrink-0 mt-0.5" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Pulse className="w-3/4 h-3 bg-white/[0.04] rounded" />
              <Pulse className="w-1/2 h-2.5 bg-white/[0.02] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans">
      {/* Header */}
      <div className="w-full h-11 border-b border-white/[0.06] flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-3">
          <Pulse className="w-5 h-5 rounded bg-white/10" />
          <Pulse className="w-32 h-3.5 bg-white/10 rounded-md" />
        </div>
        <div className="flex items-center gap-3">
          <Pulse className="w-20 h-7 rounded-pill bg-white/[0.04] border border-white/[0.06]" />
          <Pulse className="w-7 h-7 rounded-full bg-white/[0.05]" />
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] w-full mx-auto p-6 md:p-12 flex flex-col lg:flex-row gap-8">
        <div className="flex-1 flex flex-col gap-6">
          {/* Greeting + Title */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-1"
          >
            <Pulse className="w-48 h-3.5 bg-white/[0.04] rounded" />
            <Pulse className="w-52 h-7 bg-white/[0.07] rounded-md" />
          </motion.div>

          {/* Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 + i * 0.06 }}
              >
                <MetricSkeleton />
              </motion.div>
            ))}
          </motion.div>

          {/* Search Toolbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="flex items-center gap-3"
          >
            <Pulse className="flex-1 h-9 rounded-pill bg-white/[0.04]" />
            <Pulse className="w-32 h-9 rounded-pill bg-white/[0.04]" />
            <Pulse className="w-9 h-9 rounded-pill bg-white/[0.04]" />
          </motion.div>

          {/* Interview List */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="flex flex-col gap-3"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.3 + i * 0.08 }}
              >
                <InterviewCardSkeleton />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="w-full lg:w-[440px] flex flex-col gap-6"
        >
          <ScheduleFormSkeleton />
          <ActivityFeedSkeleton />
        </motion.div>
      </main>
    </div>
  );
}
