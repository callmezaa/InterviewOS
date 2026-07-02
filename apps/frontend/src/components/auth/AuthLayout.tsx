'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Terminal, ArrowLeft } from 'lucide-react';
import { ProductPreview } from './ProductPreview';
import { useBranding } from '../providers/BrandingProvider';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
  subheading?: string;
}

export function AuthLayout({ children, heading, subheading }: AuthLayoutProps) {
  const branding = useBranding();

  const logoElement = branding.logoUrl ? (
    <img src={branding.logoUrl} alt={branding.name} className="w-3.5 h-3.5 object-contain" />
  ) : (
    <Terminal className="w-3.5 h-3.5" style={{ color: branding.primaryColor }} />
  );

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans">

      {/* ── LEFT PANEL: 50% Branding ──────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col bg-surface-black min-h-0">

        {/* Content — flex-col with min-h-0 so middle can scroll */}
        <div className="flex-1 flex flex-col min-h-0 px-10 xl:px-14 py-8 relative z-10">

          {/* Top: Logo + Back link — shrink-0 */}
          <div className="flex items-center justify-between shrink-0 mb-6">
            <Link
              href="/"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200"
            >
              <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
                {logoElement}
              </div>
              <span className="font-semibold text-[15px] tracking-tight">{branding.name}</span>
            </Link>

            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/25 hover:text-white/50 text-[12px] transition-colors duration-200 group"
            >
              <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
              Back to home
            </Link>
          </div>

          {/* Middle: Headline + Subheadline + Preview — scrollable, flex-1 min-h-0 */}
          <div className="flex-1 flex flex-col justify-center gap-6 min-h-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
            <motion.div
              className="flex flex-col gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="font-display font-semibold text-[clamp(28px,3.5vw,36px)] leading-[1.1] tracking-[-0.02em] text-white">
                {heading || 'Master Your Next Interview'}
              </h1>
              <p className="text-[14px] leading-[1.6] text-white/45">
                {subheading || 'Practice with AI-powered mock interviews and get real-time feedback to land your dream job.'}
              </p>
            </motion.div>

            <ProductPreview />
          </div>

          {/* Bottom: Trust — shrink-0 */}
          <div className="flex flex-col gap-4 shrink-0 mt-6">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/15"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
              <span className="text-[10px] text-white/35">
                SOC2-aligned · End-to-end encrypted · GDPR ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: 50% Form ────────────────────────────────── */}
      <main id="main-content" className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 sm:px-10 relative bg-surface-black overflow-hidden">

        {/* Mobile: Back link */}
        <div className="flex lg:hidden items-center justify-between w-full max-w-[400px] mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors duration-200"
          >
            <div className="w-7 h-7 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              {logoElement}
            </div>
            <span className="font-semibold text-[15px] tracking-tight">{branding.name}</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-white/25 hover:text-white/50 text-[12px] transition-colors duration-200 group"
          >
            <ArrowLeft className="w-3 h-3 transition-transform duration-200 group-hover:-translate-x-0.5" />
            Home
          </Link>
        </div>

        {/* Form container */}
        <motion.div
          className="w-full max-w-[400px] relative z-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
        >
          {children}
        </motion.div>

        {/* Mobile: Trust badges */}
        <div className="flex lg:hidden items-center justify-center gap-4 mt-8">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-white/15"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></svg>
          <span className="text-[10px] text-white/35">
            SOC2-aligned · End-to-end encrypted · GDPR ready
          </span>
        </div>
      </main>
    </div>
  );
}
