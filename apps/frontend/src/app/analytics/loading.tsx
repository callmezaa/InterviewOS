import { BarChart3 } from 'lucide-react';

export default function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-surface-black text-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5 text-white/20" />
          </div>
          <div>
            <div className="w-32 h-6 rounded bg-white/[0.06] mb-1" />
            <div className="w-48 h-3 rounded bg-white/[0.04]" />
          </div>
        </div>
        <div className="flex flex-col gap-4 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-4">
                <div className="w-4 h-4 rounded bg-white/[0.06] mb-3" />
                <div className="w-16 h-3 rounded bg-white/[0.06] mb-2" />
                <div className="w-24 h-7 rounded bg-white/[0.06] mb-1.5" />
                <div className="w-32 h-3 rounded bg-white/[0.06]" />
                <div className="w-full h-[3px] rounded-full bg-white/[0.04] mt-3" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[260px]" />
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[260px]" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[320px]" />
            <div className="rounded-lg bg-white/[0.02] border border-white/[0.06] p-6 h-[320px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
