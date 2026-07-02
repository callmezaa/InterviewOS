'use client';

import React from 'react';
import { motion } from 'framer-motion';

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function AuthSkeleton() {
  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">

      {/* LEFT PANEL skeleton */}
      <div className="hidden lg:flex lg:w-1/2 flex-col bg-surface-black px-12 xl:px-16 py-12">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Pulse className="w-7 h-7 rounded-md bg-white/[0.05]" />
          <Pulse className="w-20 h-4 bg-white/[0.05] rounded" />
        </div>

        {/* Headline */}
        <div className="flex-1 flex flex-col justify-center max-w-[440px]">
          <div className="flex flex-col gap-3 mb-8">
            <Pulse className="w-64 h-8 bg-white/[0.05] rounded" />
            <Pulse className="w-48 h-8 bg-white/[0.04] rounded" />
          </div>
          <Pulse className="w-80 h-4 bg-white/[0.03] rounded mb-2" />
          <Pulse className="w-60 h-4 bg-white/[0.03] rounded mb-8" />

          {/* Preview skeleton */}
          <Pulse className="w-full max-w-[380px] h-48 rounded-lg bg-white/[0.03]" />
        </div>

        {/* Metrics */}
        <div className="flex gap-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Pulse className="w-4 h-4 rounded bg-white/[0.04]" />
              <div className="flex flex-col gap-1">
                <Pulse className="w-10 h-4 bg-white/[0.04] rounded" />
                <Pulse className="w-14 h-2.5 bg-white/[0.03] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL skeleton */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-10 bg-surface-black">
        <motion.div
          className="w-full max-w-[400px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <Pulse className="w-7 h-7 rounded-md bg-white/[0.05]" />
            <Pulse className="w-20 h-4 bg-white/[0.05] rounded" />
          </div>

          {/* Heading */}
          <div className="flex flex-col gap-2 mb-7">
            <Pulse className="w-40 h-7 bg-white/[0.05] rounded" />
            <Pulse className="w-56 h-3.5 bg-white/[0.03] rounded" />
          </div>

          {/* Form */}
          <div className="flex flex-col gap-5">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col gap-2">
                <Pulse className="w-14 h-3 bg-white/[0.04] rounded" />
                <Pulse className="w-full h-12 rounded-lg bg-white/[0.03]" />
              </div>
            ))}
            <Pulse className="w-full h-12 rounded-full bg-white/[0.05]" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-6">
            <Pulse className="flex-1 h-px bg-white/[0.04]" />
            <Pulse className="w-24 h-3 bg-white/[0.03] rounded" />
            <Pulse className="flex-1 h-px bg-white/[0.04]" />
          </div>

          {/* OAuth */}
          <div className="flex flex-col gap-2.5 mt-5">
            <Pulse className="w-full h-12 rounded-lg bg-white/[0.03]" />
            <Pulse className="w-full h-12 rounded-lg bg-white/[0.03]" />
          </div>

          {/* Footer */}
          <div className="mt-7 pt-5 border-t border-white/[0.06] flex justify-center">
            <Pulse className="w-48 h-3.5 bg-white/[0.03] rounded" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
