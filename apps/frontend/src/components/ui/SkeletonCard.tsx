import React from 'react';

const shimmer = `relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.03] before:to-transparent before:z-10`;

function Pulse({ className }: { className: string }) {
  return <div className={`${className} animate-pulse`} />;
}

interface SkeletonCardProps {
  count?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ count = 3 }) => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className={`${shimmer} rounded-lg border border-white/[0.06] bg-surface-tile-1/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-6`}
        >
          {/* Left Block */}
          <div className="flex-1 flex flex-col gap-3.5 relative z-0">
            <div className="flex items-center gap-3">
              <Pulse className="h-5 w-20 rounded-pill bg-white/[0.05]" />
              <Pulse className="h-4 w-32 bg-white/[0.03] rounded" />
            </div>
            <Pulse className="h-6 w-2/3 bg-white/[0.06] rounded-md" />
            <div className="flex flex-col gap-2">
              <Pulse className="h-3.5 w-full bg-white/[0.03] rounded" />
              <Pulse className="h-3.5 w-4/5 bg-white/[0.03] rounded" />
            </div>
          </div>

          {/* Right Block */}
          <div className="flex items-center gap-3 shrink-0 relative z-0">
            <Pulse className="h-9 w-24 rounded-pill bg-white/[0.04] border border-white/[0.06]" />
            <Pulse className="h-9 w-32 rounded-pill bg-white/[0.07]" />
          </div>
        </div>
      ))}
    </div>
  );
};
