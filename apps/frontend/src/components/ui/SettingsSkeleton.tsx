'use client';

import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function SettingsSkeleton() {
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

      <main className="flex-1 max-w-[960px] w-full mx-auto p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col gap-6"
        >
          {/* Page Title */}
          <div className="flex flex-col gap-1">
            <Pulse className="w-16 h-3.5 bg-white/[0.04] rounded" />
            <Pulse className="w-40 h-7 bg-white/[0.07] rounded-md" />
            <Pulse className="w-64 h-3 bg-white/[0.03] rounded" />
          </div>

          {/* Tab Bar */}
          <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
            {[0, 1, 2].map((i) => (
              <Pulse key={i} className="h-8 w-28 rounded-pill bg-white/[0.04]" />
            ))}
          </div>

          {/* Tab Content */}
          <div className={`${shimmer} rounded-lg border border-white/[0.06] bg-surface-tile-1/40 p-6 flex flex-col gap-6`}>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Pulse className="w-12 h-12 rounded-full bg-white/[0.05]" />
                <div className="flex flex-col gap-2">
                  <Pulse className="w-36 h-4 bg-white/[0.06] rounded-md" />
                  <Pulse className="w-48 h-3 bg-white/[0.03]" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <Pulse className="w-20 h-3 bg-white/[0.04]" />
                    <Pulse className="w-full h-9 rounded-lg bg-white/[0.04]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[0.06] pt-6 flex flex-col gap-4">
              <Pulse className="w-32 h-4 bg-white/[0.06] rounded-md" />
              <div className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                <div className="flex flex-col gap-1">
                  <Pulse className="w-28 h-3.5 bg-white/[0.05]" />
                  <Pulse className="w-44 h-3 bg-white/[0.03]" />
                </div>
                <Pulse className="w-11 h-6 rounded-full bg-white/[0.05]" />
              </div>
            </div>

            <div className="pt-2">
              <Pulse className="w-28 h-9 rounded-pill bg-white/[0.07]" />
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
