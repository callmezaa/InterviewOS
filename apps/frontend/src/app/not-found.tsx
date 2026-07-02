import Link from 'next/link';
import { Terminal, ArrowLeft, LayoutDashboard, BookOpen, LifeBuoy } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none opacity-[0.08]"
        style={{
          background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8 text-center max-w-[520px]">
        {/* Brand */}
        <div className="flex items-center gap-2 select-none">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-[16px] tracking-tight">InterviewOS</span>
        </div>

        {/* 404 with terminal aesthetic */}
        <div className="relative">
          <span className="font-mono font-bold text-[140px] leading-none tracking-[-0.08em] text-white/[0.06] select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <span className="font-mono text-[20px] font-bold text-primary">?</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-display font-semibold text-[28px] text-white/90 tracking-tight">
            Page not found
          </h1>
          <p className="text-body-muted/50 text-[14px] leading-relaxed max-w-[380px]">
            The page you&apos;re looking for doesn&apos;t exist, may have been moved, or the URL might be misspelled.
          </p>
        </div>

        {/* Primary action */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full text-[14px] font-medium tracking-tight hover:bg-primary-focus transition-all duration-200 shadow-[0_4px_12px_-2px_var(--color-primary-glow)]"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Back to home</span>
        </Link>

        {/* Quick links */}
        <div className="flex items-center gap-3 mt-2">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] text-body-muted/50 hover:text-white bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/docs"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] text-body-muted/50 hover:text-white bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Documentation</span>
          </Link>
          <Link
            href="/support"
            className="group flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] text-body-muted/50 hover:text-white bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] hover:bg-white/[0.04] transition-all duration-200"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Support</span>
          </Link>
        </div>

        {/* Terminal-style hint */}
        <div className="mt-4 px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg max-w-[340px]">
          <p className="text-[11px] font-mono text-body-muted/35 leading-relaxed">
            <span className="text-primary/60">$</span> If you believe this is an error, contact support or check the URL for typos.
          </p>
        </div>
      </div>
    </div>
  );
}
