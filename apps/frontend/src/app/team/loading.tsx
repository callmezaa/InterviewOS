'use client';

import { SkeletonBlock, Pulse } from '../../components/ui/Skeleton';

export default function TeamLoading() {
  return (
    <div className="flex-1 bg-surface-black text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <SkeletonBlock className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Pulse className="h-7 w-40 bg-white/[0.06] rounded-lg" />
              <Pulse className="h-4 w-64 bg-white/[0.04] rounded" />
            </div>
            <Pulse className="h-9 w-32 bg-white/[0.06] rounded-lg" />
          </div>

          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <Pulse className="w-10 h-10 rounded-full bg-white/[0.06]" />
                <div className="flex-1 flex flex-col gap-2">
                  <Pulse className="h-4 w-32 bg-white/[0.06] rounded" />
                  <Pulse className="h-3 w-48 bg-white/[0.04] rounded" />
                </div>
                <Pulse className="h-6 w-20 bg-white/[0.04] rounded-full" />
              </div>
            ))}
          </div>
        </SkeletonBlock>
      </div>
    </div>
  );
}
