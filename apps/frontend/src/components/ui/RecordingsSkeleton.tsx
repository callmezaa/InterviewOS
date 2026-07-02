import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function RecordingsSkeleton() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans">
      <div className="w-full h-11 border-b border-white/[0.06]" />
      <main className="min-h-screen bg-surface-black px-4 md:px-12 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col gap-6"
          >
            {/* Hero */}
            <div className="flex items-center gap-3 mb-1">
              <Pulse className="w-5 h-5 rounded bg-white/[0.06]" />
              <Pulse className="w-52 h-7 bg-white/[0.07] rounded-md" />
            </div>
            <Pulse className="w-96 h-3.5 bg-white/[0.03] rounded" />

            {/* Stats bar */}
            <div className="flex flex-wrap gap-4">
              <Pulse className="h-9 w-36 rounded-lg bg-white/[0.04]" />
              <Pulse className="h-9 w-32 rounded-lg bg-white/[0.04]" />
            </div>

            {/* Search */}
            <Pulse className="h-9 w-80 rounded-lg bg-white/[0.04]" />

            {/* List + Player layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 flex flex-col gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`${shimmer} flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.01]`}>
                    <Pulse className="w-16 h-10 rounded-md bg-white/[0.04]" />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Pulse className="w-3/4 h-3.5 bg-white/[0.06] rounded-md" />
                      <Pulse className="w-1/2 h-3 bg-white/[0.03] rounded" />
                    </div>
                    <Pulse className="w-16 h-3 bg-white/[0.03] rounded hidden sm:block" />
                    <div className="flex gap-1">
                      <Pulse className="w-8 h-8 rounded-md bg-white/[0.04]" />
                      <Pulse className="w-8 h-8 rounded-md bg-white/[0.04]" />
                      <Pulse className="w-8 h-8 rounded-md bg-white/[0.04]" />
                    </div>
                  </div>
                ))}
              </div>
              <Pulse className="w-full lg:w-[480px] h-[320px] rounded-xl bg-white/[0.02] border border-white/[0.06]" />
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
