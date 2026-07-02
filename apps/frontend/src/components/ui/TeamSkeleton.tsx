import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function TeamSkeleton() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans">
      <div className="w-full h-11 border-b border-white/[0.06]" />
      <main className="flex-1 max-w-[960px] w-full mx-auto p-4 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* Header + Invite button */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <Pulse className="w-16 h-3.5 bg-white/[0.04] rounded" />
              <Pulse className="w-40 h-7 bg-white/[0.07] rounded-md" />
              <Pulse className="w-56 h-3.5 bg-white/[0.03] rounded" />
            </div>
            <Pulse className="w-28 h-9 rounded-pill bg-white/[0.06]" />
          </div>

          {/* Team Stats */}
          <div className="flex items-center gap-4">
            <Pulse className="h-9 w-28 rounded-lg bg-white/[0.04]" />
            <Pulse className="h-9 w-28 rounded-lg bg-white/[0.04]" />
            <Pulse className="h-9 w-36 rounded-lg bg-white/[0.04]" />
          </div>

          {/* Search */}
          <Pulse className="h-9 w-64 rounded-lg bg-white/[0.04]" />

          {/* Member List */}
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`${shimmer} flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]`}>
                <Pulse className="w-10 h-10 rounded-full bg-white/[0.05]" />
                <div className="flex-1 flex flex-col gap-1">
                  <Pulse className="w-40 h-4 bg-white/[0.06] rounded-md" />
                  <Pulse className="w-56 h-3 bg-white/[0.03] rounded" />
                </div>
                <Pulse className="w-20 h-6 rounded-md bg-white/[0.04]" />
                <Pulse className="w-8 h-8 rounded-md bg-white/[0.04]" />
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
