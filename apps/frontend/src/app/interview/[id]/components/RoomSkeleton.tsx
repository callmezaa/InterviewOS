import React from 'react';
import { motion } from 'framer-motion';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      {children}
    </motion.div>
  );
}

export const RoomSkeleton: React.FC = () => {
  return (
    <div className="h-screen w-full bg-surface-black text-white flex flex-col font-sans overflow-hidden select-none">

      {/* Skeleton Header */}
      <Section delay={0}>
        <header className="h-14 border-b border-white/[0.06] bg-surface-tile-2/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Pulse className="w-6 h-6 rounded bg-white/10" />
            <Pulse className="w-56 h-4 bg-white/10 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <Pulse className="w-20 h-7 bg-white/[0.04] border border-white/[0.06] rounded-pill" />
            <Pulse className="w-24 h-7 bg-white/[0.04] border border-white/[0.06] rounded-pill" />
            <Pulse className="w-28 h-7 bg-white/[0.06] rounded-pill" />
            <Pulse className="w-16 h-7 bg-white/[0.04] border border-white/[0.06] rounded-pill" />
          </div>
        </header>
      </Section>

      {/* Main Grid */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-2 sm:p-4 gap-2 sm:gap-4">

        {/* LEFT COLUMN */}
        <div className="w-full md:w-[280px] lg:w-[380px] flex flex-row md:flex-col gap-2 sm:gap-4 shrink-0">

          {/* Local User Stream */}
          <Section delay={0.05}>
            <div className={`${shimmer} w-[200px] sm:w-[280px] md:w-full aspect-[1/1] bg-surface-tile-2/80 border border-white/[0.06] rounded-lg p-3 sm:p-4 flex flex-col justify-between`}>
              <div className="flex justify-between items-center">
                <Pulse className="w-16 sm:w-20 h-3.5 bg-white/10 rounded" />
                <Pulse className="w-10 sm:w-12 h-3.5 bg-white/10 rounded-pill" />
              </div>
              <div className="self-center flex items-center justify-center">
                <Pulse className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white/5" />
              </div>
              <div className="flex justify-between items-center">
                <Pulse className="w-20 sm:w-28 h-4 bg-white/15 rounded-pill" />
                <Pulse className="w-12 sm:w-16 h-3 bg-white/10 rounded" />
              </div>
            </div>
          </Section>

          {/* Peer Stream */}
          <Section delay={0.08}>
            <div className="w-[200px] sm:w-[280px] md:w-full aspect-[1/1] bg-surface-tile-2/30 border border-dashed border-white/[0.06] rounded-lg flex flex-col items-center justify-center gap-2 p-3 sm:p-4">
              <Pulse className="w-6 sm:w-8 h-6 sm:h-8 rounded-full bg-white/5" />
              <Pulse className="w-28 sm:w-36 h-3 bg-white/5 rounded-pill" />
            </div>
          </Section>

          {/* Media Controls */}
          <Section delay={0.1}>
            <div className={`${shimmer} hidden md:flex justify-around items-center bg-surface-tile-2/60 border border-white/[0.06] rounded-lg p-3 w-full`}>
              <Pulse className="w-10 h-10 rounded-full bg-white/[0.05]" />
              <Pulse className="w-10 h-10 rounded-full bg-white/[0.05]" />
              <Pulse className="w-10 h-10 rounded-full bg-white/[0.05]" />
            </div>
          </Section>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-2 sm:gap-4 min-w-0">

          {/* Main Workspace */}
          <div className="flex-[3] flex flex-col gap-3 min-h-[200px] sm:min-h-[300px]">
            {/* Tabs */}
            <Section delay={0.12}>
              <div className="flex items-center gap-2 border-b border-white/[0.06] pb-2 shrink-0">
                <Pulse className="w-24 h-7 bg-primary/20 rounded-pill border border-primary/30" />
                <Pulse className="w-32 h-7 bg-white/[0.04] rounded-pill border border-white/[0.06]" />
              </div>
            </Section>

            {/* Editor */}
            <Section delay={0.15}>
              <div className={`${shimmer} flex-1 bg-surface-tile-2 border border-white/[0.06] rounded-lg p-5 flex flex-col gap-3`}>
                <Pulse className="w-1/3 h-3.5 bg-white/10 rounded" />
                <Pulse className="w-2/3 h-3.5 bg-white/10 rounded" />
                <Pulse className="w-1/2 h-3.5 bg-white/10 rounded" />
                <Pulse className="w-3/4 h-3.5 bg-white/10 rounded" />
                <Pulse className="w-2/5 h-3.5 bg-white/10 rounded" />
                <Pulse className="w-3/5 h-3.5 bg-white/10 rounded" />
              </div>
            </Section>

            {/* Console */}
            <Section delay={0.18}>
              <div className="bg-surface-tile-2/80 border border-white/[0.06] rounded-lg h-[38px] flex items-center justify-between px-4 shrink-0">
                <div className="flex gap-4">
                  <Pulse className="w-28 h-3.5 bg-white/10 rounded" />
                  <Pulse className="w-32 h-3.5 bg-white/15 rounded" />
                </div>
                <Pulse className="w-12 h-3 bg-white/10 rounded" />
              </div>
            </Section>
          </div>

          {/* Bottom Panel */}
          <div className="flex-[2] min-h-[180px]">
            <Section delay={0.2}>
              <div className={`${shimmer} bg-surface-tile-1 border border-white/[0.06] rounded-lg overflow-hidden flex flex-col h-full`}>
                <div className="h-10 bg-surface-tile-2 border-b border-white/[0.06] flex items-center justify-between px-4 shrink-0">
                  <div className="flex gap-2">
                    <Pulse className="w-36 h-6 bg-white/[0.04] border border-white/[0.06] rounded" />
                    <Pulse className="w-20 h-6 bg-white/[0.04] border border-white/[0.06] rounded" />
                  </div>
                  <Pulse className="w-24 h-3 bg-white/5 rounded" />
                </div>
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Pulse className="w-24 h-4 bg-white/10 rounded-pill" />
                    <Pulse className="w-12 h-3 bg-white/5 rounded" />
                  </div>
                  <Pulse className="w-5/6 h-3 bg-white/5 rounded" />
                  <Pulse className="w-4/6 h-3 bg-white/5 rounded" />
                </div>
              </div>
            </Section>
          </div>

        </div>
      </div>
    </div>
  );
};
