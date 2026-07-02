import React from 'react';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10 pointer-events-none select-none`;

export function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

export function SkeletonBlock({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return <div className={`${shimmer} ${className}`}>{children}</div>;
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <Pulse className={`h-3 bg-white/[0.07] rounded ${className}`} />;
}

/** Skeleton for Monaco Editor / code editing area */
export function EditorSkeleton() {
  return (
    <div className="flex-1 flex bg-editor-bg rounded-lg border border-white/[0.06] overflow-hidden">
      <SkeletonBlock className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 mb-2">
          <Pulse className="w-4 h-4 rounded bg-white/[0.04]" />
          <SkeletonLine className="w-32" />
        </div>
        <SkeletonLine className="w-[35%]" />
        <SkeletonLine className="w-[65%]" />
        <SkeletonLine className="w-[45%]" />
        <SkeletonLine className="w-[80%]" />
        <SkeletonLine className="w-[55%]" />
        <SkeletonLine className="w-[30%]" />
        <SkeletonLine className="w-[70%] mt-2" />
        <SkeletonLine className="w-[50%]" />
        <SkeletonLine className="w-[60%]" />
        <div className="mt-auto flex items-center gap-3 pt-4 border-t border-white/[0.04]">
          <Pulse className="w-16 h-6 rounded-md bg-white/[0.04]" />
          <Pulse className="w-20 h-6 rounded-md bg-primary/20" />
        </div>
      </SkeletonBlock>
    </div>
  );
}

/** Skeleton for Whiteboard canvas area */
export function WhiteboardSkeleton() {
  return (
    <div className="flex-1 flex bg-editor-bg rounded-lg border border-white/[0.06] overflow-hidden">
      <SkeletonBlock className="flex-1 p-5 flex flex-col gap-3 items-center justify-center">
        <Pulse className="w-16 h-16 rounded-full bg-white/[0.03]" />
        <SkeletonLine className="w-40" />
        <SkeletonLine className="w-56" />
        <div className="flex gap-2 mt-4">
          <Pulse className="w-8 h-8 rounded-lg bg-white/[0.04]" />
          <Pulse className="w-8 h-8 rounded-lg bg-white/[0.04]" />
          <Pulse className="w-8 h-8 rounded-lg bg-white/[0.04]" />
          <Pulse className="w-8 h-8 rounded-lg bg-white/[0.04]" />
        </div>
      </SkeletonBlock>
    </div>
  );
}

/** Skeleton for code playback / replay panel */
export function CodeReplaySkeleton() {
  return (
    <div className="h-[220px] flex bg-white/[0.01] border border-white/[0.06] rounded-lg overflow-hidden">
      <SkeletonBlock className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <SkeletonLine className="w-24" />
          <div className="flex gap-2">
            <Pulse className="w-7 h-7 rounded bg-white/[0.04]" />
            <Pulse className="w-7 h-7 rounded bg-white/[0.04]" />
            <Pulse className="w-7 h-7 rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center gap-2">
          <Pulse className="w-4 h-4 rounded-full bg-white/[0.03]" />
          <SkeletonLine className="w-48" />
        </div>
        <Pulse className="w-full h-1.5 rounded-full bg-white/[0.04]" />
      </SkeletonBlock>
    </div>
  );
}

/** Skeleton for AI feedback / metrics panel */
export function MetricsSkeleton() {
  return (
    <div className="h-[220px] flex bg-white/[0.01] border border-white/[0.06] rounded-lg overflow-hidden">
      <SkeletonBlock className="flex-1 p-5 flex flex-col gap-3">
        <div className="flex gap-4">
          <Pulse className="flex-1 h-16 rounded-lg bg-white/[0.03]" />
          <Pulse className="flex-1 h-16 rounded-lg bg-white/[0.03]" />
          <Pulse className="flex-1 h-16 rounded-lg bg-white/[0.03]" />
        </div>
        <SkeletonLine className="w-1/2" />
        <SkeletonLine className="w-2/3" />
        <div className="flex gap-2 mt-auto">
          <Pulse className="w-20 h-6 rounded-md bg-white/[0.04]" />
          <Pulse className="w-24 h-6 rounded-md bg-white/[0.04]" />
        </div>
      </SkeletonBlock>
    </div>
  );
}
