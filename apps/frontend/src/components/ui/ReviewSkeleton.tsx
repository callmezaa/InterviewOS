import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function ReviewSkeleton() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col font-sans">
      {/* Header */}
      <div className="w-full h-11 border-b border-white/[0.06] flex items-center justify-between px-4 md:px-12">
        <div className="flex items-center gap-3">
          <Pulse className="w-4 h-4 rounded bg-white/10" />
          <div className="flex items-center gap-2">
            <Pulse className="w-4 h-4 rounded bg-white/[0.06]" />
            <Pulse className="w-28 h-3.5 bg-white/10 rounded-md" />
          </div>
        </div>
        <Pulse className="w-12 h-3 bg-white/[0.05] rounded" />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-12 flex flex-col gap-8"
      >
        {/* Breadcrumb */}
        <Pulse className="w-48 h-3.5 bg-white/[0.04] rounded" />

        {/* Hero — Score + Stats */}
        <div className={`${shimmer} rounded-xl border border-white/[0.06] bg-white/[0.01] p-6`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <Pulse className="w-24 h-24 rounded-full bg-white/[0.04]" />
            <div className="flex-1 flex flex-col gap-2">
              <Pulse className="w-64 h-5 bg-white/[0.07] rounded-md" />
              <div className="flex gap-4 mt-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <Pulse className="w-16 h-3 bg-white/[0.04]" />
                    <Pulse className="w-12 h-5 bg-white/[0.06] rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <Pulse className="flex-1 h-2 rounded-full bg-white/[0.04]" />
          </div>
        </div>

        {/* Recording Player */}
        <Pulse className="w-full h-[300px] rounded-xl bg-white/[0.02] border border-white/[0.06]" />

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col gap-4`}>
              <Pulse className="w-32 h-4 bg-white/[0.06] rounded-md" />
              <Pulse className="w-full h-3 bg-white/[0.03] rounded" />
              <Pulse className="w-3/4 h-3 bg-white/[0.03] rounded" />
              <Pulse className="w-5/6 h-3 bg-white/[0.03] rounded" />
              <Pulse className="w-2/3 h-3 bg-white/[0.03] rounded" />
              <div className="flex gap-3 mt-2">
                {[0, 1].map((i) => (
                  <Pulse key={i} className="flex-1 h-16 rounded-lg bg-white/[0.03]" />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col gap-3`}>
              <Pulse className="w-24 h-4 bg-white/[0.06] rounded-md" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Pulse className="w-16 h-2.5 bg-white/[0.04] rounded" />
                  <Pulse className="w-full h-3 bg-white/[0.03] rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Code Review */}
        <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-white/[0.01] p-6 flex flex-col gap-4`}>
          <Pulse className="w-28 h-4 bg-white/[0.06] rounded-md" />
          <div className="flex gap-2 mb-2">
            <Pulse className="w-20 h-7 rounded-pill bg-white/[0.04]" />
            <Pulse className="w-24 h-7 rounded-pill bg-white/[0.04]" />
          </div>
          <Pulse className="w-full h-[160px] rounded-lg bg-white/[0.03]" />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] pb-8">
          <div className="flex gap-3">
            <Pulse className="w-36 h-9 rounded-pill bg-white/[0.04]" />
            <Pulse className="w-24 h-9 rounded-pill bg-white/[0.04]" />
          </div>
          <Pulse className="w-28 h-3 bg-white/[0.03] rounded" />
        </div>
      </motion.div>
    </div>
  );
}
