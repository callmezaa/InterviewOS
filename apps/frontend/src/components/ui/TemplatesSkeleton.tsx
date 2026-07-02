import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function TemplatesSkeleton() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans">
      <div className="w-full h-11 border-b border-white/[0.06]" />
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* Header */}
          <div className="flex flex-col gap-1">
            <Pulse className="w-16 h-3.5 bg-white/[0.04] rounded" />
            <Pulse className="w-52 h-7 bg-white/[0.07] rounded-md" />
            <Pulse className="w-80 h-3.5 bg-white/[0.03] rounded" />
          </div>

          {/* Search */}
          <Pulse className="h-9 w-72 rounded-lg bg-white/[0.04]" />

          {/* Category Tabs */}
          <div className="flex items-center gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Pulse key={i} className="h-8 w-24 rounded-pill bg-white/[0.04]" />
            ))}
          </div>

          {/* Template Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`${shimmer} rounded-xl border border-white/[0.06] bg-white/[0.01] p-5 flex flex-col gap-3`}>
                <div className="flex items-center gap-2">
                  <Pulse className="w-8 h-8 rounded-lg bg-white/[0.04]" />
                  <div className="flex flex-col gap-1 flex-1">
                    <Pulse className="w-3/4 h-4 bg-white/[0.06] rounded-md" />
                    <Pulse className="w-1/2 h-3 bg-white/[0.03] rounded" />
                  </div>
                </div>
                <Pulse className="w-full h-3 bg-white/[0.03] rounded" />
                <Pulse className="w-5/6 h-3 bg-white/[0.03] rounded" />
                <div className="flex items-center gap-2 mt-auto pt-2">
                  <Pulse className="w-16 h-6 rounded-pill bg-white/[0.04]" />
                  <Pulse className="flex-1 h-8 rounded-lg bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
