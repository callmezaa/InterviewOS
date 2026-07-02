import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function CandidateProfileSkeleton() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans">
      <div className="w-full h-11 border-b border-white/[0.06]" />
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-8 flex flex-col gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* Hero — Avatar + Name + Email */}
          <div className="flex items-center gap-4">
            <Pulse className="w-16 h-16 rounded-full bg-white/[0.05]" />
            <div className="flex flex-col gap-1.5">
              <Pulse className="w-44 h-5 bg-white/[0.07] rounded-md" />
              <Pulse className="w-56 h-3.5 bg-white/[0.03] rounded" />
              <Pulse className="w-32 h-3 bg-white/[0.03] rounded" />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${shimmer} p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-2`}>
                <Pulse className="w-8 h-8 rounded-lg bg-white/[0.04]" />
                <Pulse className="w-12 h-6 bg-white/[0.07] rounded-md" />
                <Pulse className="w-20 h-3 bg-white/[0.03] rounded" />
              </div>
            ))}
          </div>

          {/* Section Title */}
          <Pulse className="w-36 h-4 bg-white/[0.06] rounded-md" />

          {/* Interview History List */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={`${shimmer} p-4 rounded-xl border border-white/[0.06] bg-white/[0.01] flex items-center gap-4`}>
                <Pulse className="w-10 h-10 rounded-lg bg-white/[0.04]" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <Pulse className="w-3/5 h-4 bg-white/[0.06] rounded-md" />
                  <Pulse className="w-2/5 h-3 bg-white/[0.03] rounded" />
                </div>
                <div className="flex items-center gap-3">
                  <Pulse className="w-12 h-5 rounded-md bg-white/[0.05]" />
                  <Pulse className="w-8 h-8 rounded-md bg-white/[0.04]" />
                </div>
              </div>
            ))}
          </div>

          {/* Skills Section */}
          <div className={`${shimmer} p-5 rounded-xl border border-white/[0.06] bg-white/[0.01] flex flex-col gap-4`}>
            <Pulse className="w-28 h-4 bg-white/[0.06] rounded-md" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Pulse key={i} className="w-20 h-7 rounded-pill bg-white/[0.04]" />
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
