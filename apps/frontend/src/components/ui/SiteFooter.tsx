'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'motion/react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

// ── Inline SVG social icons ──
function IconGitHub({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function IconTwitterX({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function IconLinkedIn({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const NAV_PRODUCT = [
  { label: 'Features',       href: '#features' },
  { label: 'How it works',  href: '#how-it-works' },
  { label: 'Testimonials',  href: '#testimonials' },
  { label: 'Dashboard',     href: '/dashboard' },
];

const NAV_COMPANY = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use',   href: '#' },
  { label: 'Documentation',  href: '#' },
  { label: 'Status',         href: '#' },
];

const SOCIALS = [
  { label: 'GitHub',   href: 'https://github.com',    icon: IconGitHub },
  { label: 'Twitter',  href: 'https://twitter.com',   icon: IconTwitterX },
  { label: 'LinkedIn', href: 'https://linkedin.com',  icon: IconLinkedIn },
];

const STAGGER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const ITEM = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
};

export function SiteFooter() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.1 });

  return (
    <footer ref={ref} className="bg-surface-black font-sans">

      {/* ── Main footer body ── */}
      <motion.div
        variants={STAGGER}
        initial="hidden"
        animate={isInView ? 'visible' : 'hidden'}
        className="max-w-[1100px] mx-auto px-6 md:px-12 pt-16 pb-12 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8"
      >

        {/* ── Col 1: Branding (5 cols) ── */}
        <motion.div variants={ITEM} className="md:col-span-5 flex flex-col gap-5">
          {/* Logo */}
          <div className="flex items-center gap-2 select-none">
            <Image
              src="/logo/logo_white.png"
              alt="InterviewOS"
              width={100}
              height={24}
              className="hidden dark:block"
            />
            <Image
              src="/logo/logo_black.png"
              alt="InterviewOS"
              width={100}
              height={24}
              className="block dark:hidden"
            />
          </div>

          {/* Tagline */}
          <p className="text-body-muted/45 text-[13px] leading-[1.65] max-w-[280px] tracking-tight">
            The cinematic platform for engineering interviews. WebRTC signaling, live collaboration, and AI evaluation — in one session.
          </p>

          {/* Status pill */}
          <div className="flex items-center gap-2 w-fit px-3 py-1.5 bg-white/[0.02] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-white/[0.3]" />
            <span className="text-[11px] font-mono text-white/55">
              All systems operational
            </span>
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3 mt-1">
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
              >
                <Icon className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        </motion.div>

        {/* ── Col 2: Product (3 cols) ── */}
        <motion.div variants={ITEM} className="md:col-span-3 flex flex-col gap-4">
          <p className="text-[11px] font-mono font-semibold text-white/25 tracking-tight">
            Product
          </p>
          <ul className="flex flex-col gap-2.5">
            {NAV_PRODUCT.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[13px] text-body-muted/45 hover:text-white transition-colors duration-200 tracking-tight flex items-center gap-1 group"
                >
                  {label}
                  {href.startsWith('/') && !href.startsWith('/#') && (
                    <ArrowUpRight className="w-3 h-3 opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-60 transition-all duration-200" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* ── Col 3: Company (4 cols) ── */}
        <motion.div variants={ITEM} className="md:col-span-4 flex flex-col gap-4">
          <p className="text-[11px] font-mono font-semibold text-white/25 tracking-tight">
            Company
          </p>
          <ul className="flex flex-col gap-2.5">
            {NAV_COMPANY.map(({ label, href }) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[13px] text-body-muted/45 hover:text-white transition-colors duration-200 tracking-tight"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Contact block */}
          <div className="mt-3 flex flex-col gap-1.5">
            <p className="text-[11px] font-mono font-semibold text-white/25 tracking-tight">
              Contact
            </p>
            <a
              href="mailto:hello@interviewos.dev"
              className="text-[13px] text-body-muted/45 hover:text-primary-on-dark transition-colors duration-200 tracking-tight"
            >
              hello@interviewos.dev
            </a>
          </div>
        </motion.div>

      </motion.div>

      {/* ── Bottom bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="max-w-[1100px] mx-auto px-6 md:px-12 pb-8 flex flex-col sm:flex-row items-center justify-between gap-3 pt-6"
      >
        <p className="text-[11px] text-white/20 font-mono tracking-tight">
          © 2026 InterviewOS, Inc. All rights reserved.
        </p>
        <p className="text-[11px] text-white/15 font-mono tracking-tight">
          Built with Next.js · Deployed on Vercel
        </p>
      </motion.div>

    </footer>
  );
}
