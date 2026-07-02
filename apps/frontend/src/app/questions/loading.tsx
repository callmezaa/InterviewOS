'use client';

import { SkeletonBlock, SkeletonLine, Pulse } from '../../components/ui/Skeleton';

export default function QuestionsLoading() {
  return (
    <div className="flex-1 bg-surface-black text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <SkeletonBlock className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <Pulse className="h-7 w-48 bg-white/[0.06] rounded-lg" />
              <Pulse className="h-4 w-72 bg-white/[0.04] rounded" />
            </div>
            <Pulse className="h-9 w-32 bg-white/[0.06] rounded-lg" />
          </div>

          <div className="flex gap-3">
            <Pulse className="h-9 w-64 bg-white/[0.04] rounded-lg" />
            <Pulse className="h-9 w-24 bg-white/[0.04] rounded-lg" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col gap-3">
                <Pulse className="h-5 w-3/4 bg-white/[0.06] rounded" />
                <Pulse className="h-3 w-full bg-white/[0.04] rounded" />
                <Pulse className="h-3 w-2/3 bg-white/[0.04] rounded" />
                <div className="flex gap-2 mt-2">
                  <Pulse className="h-5 w-16 bg-white/[0.04] rounded-full" />
                  <Pulse className="h-5 w-20 bg-white/[0.04] rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </SkeletonBlock>
      </div>
    </div>
  );
}
