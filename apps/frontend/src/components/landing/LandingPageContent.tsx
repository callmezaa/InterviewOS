'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ScrollReveal } from '../ui/ScrollReveal';
import { useActiveSection } from '../../hooks/useActiveSection';

// ── Dynamic imports for below-fold sections ────────────────────────────────
const InteractiveShowcase = dynamic(
  () => import('../ui/InteractiveShowcase').then((m) => m.InteractiveShowcase),
  { ssr: false }
);
const HowItWorksSection = dynamic(
  () => import('../ui/HowItWorksSection').then((m) => m.HowItWorksSection),
  { ssr: false }
);
const PricingCalloutSection = dynamic(
  () => import('../ui/PricingCalloutSection').then((m) => m.PricingCalloutSection),
  { ssr: false }
);
const FAQSection = dynamic(
  () => import('../ui/FAQSection').then((m) => m.FAQSection),
  { ssr: false }
);
const PreFooterCTA = dynamic(
  () => import('../ui/PreFooterCTA').then((m) => m.PreFooterCTA),
  { ssr: false }
);
const SiteFooter = dynamic(
  () => import('../ui/SiteFooter').then((m) => m.SiteFooter),
  { ssr: false }
);
const TerminalCopyBox = dynamic(
  () => import('../ui/TerminalCopyBox').then((m) => m.TerminalCopyBox),
  { ssr: false }
);
const FeatureCard = dynamic(
  () => import('../ui/FeatureCard').then((m) => m.FeatureCard),
  { ssr: false }
);

export default function LandingPageContent() {
  const activeSection = useActiveSection(['features', 'how-it-works', 'testimonials', 'pricing', 'faq']);

  return (
    <div className="flex flex-col min-h-screen bg-surface-black text-white selection:bg-primary selection:text-white">
      {/* Global Navigation */}
      <header className="sticky top-0 z-50 h-14 bg-surface-black flex items-center justify-between px-6 md:px-12">
        {/* Left: Brand */}
        <div className="flex items-center gap-2.5 select-none">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-[15px] tracking-tight">InterviewOS</span>
        </div>

        {/* Center: Navigation Links */}
        <nav className="hidden md:flex items-center justify-center gap-8 text-[13px] font-medium select-none">
          {([
            { label: 'Features',    href: '#features',     id: 'features' },
            { label: 'How it works', href: '#how-it-works', id: 'how-it-works' },
            { label: 'Pricing',      href: '#pricing',      id: 'pricing' },
            { label: 'FAQ',          href: '#faq',          id: 'faq' },
          ] as const).map(({ label, href, id }) => {
            const isActive = activeSection === id;
            return (
              <a
                key={id}
                href={href}
                className={`transition-colors duration-200 ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {label}
              </a>
            );
          })}
        </nav>

        {/* Right: Sign In */}
        <Link href="/auth/login">
          <Button variant="ghost">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-section min-h-[85vh] relative overflow-hidden bg-surface-black">
          
          <motion.div
            className="max-w-[860px] flex flex-col items-center gap-5"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
            }}
          >
            {/* Headline */}
            <motion.div
              className="overflow-hidden"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <span className="block font-display font-semibold text-[46px] sm:text-[66px] leading-[1.05] tracking-[-0.04em] text-white">
                The OS for
              </span>
            </motion.div>

            <motion.div
              className="overflow-hidden -mt-2"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <h1 className="font-display font-semibold text-[46px] sm:text-[66px] leading-[1.05] tracking-[-0.04em] text-white/85">
                technical interviews.
              </h1>
            </motion.div>

            {/* Subheading */}
            <motion.p
              className="max-w-[540px] text-[17px] sm:text-[19px] font-normal leading-[1.55] text-body-muted/60 tracking-[-0.01em] mt-1"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              Combining WebRTC video calls, synchronized code editors, and live Whisper-transcription loops.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row items-center gap-6 mt-6"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <div className="relative group/cta">
                <Link href="/auth/login">
                  <Button variant="primary" className="w-[180px]">
                    Get Started
                  </Button>
                </Link>
              </div>

              <Link href="/auth/login" className="group/learn text-primary-on-dark flex items-center gap-1.5 font-sans text-[17px] tracking-tight hover:text-white transition-colors duration-200">
                Learn more
                <span className="text-[15px] transition-transform duration-300 ease-out transform group-hover/learn:translate-x-1.5">
                  →
                </span>
              </Link>
            </motion.div>

            {/* Terminal Copy Box */}
            <motion.div
              className="flex flex-col items-center gap-2 mt-2"
              variants={{
                hidden: { opacity: 0, y: 12, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, delay: 0.1, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <TerminalCopyBox />
              <p className="text-[11px] font-mono text-white/20 tracking-tight">
                No account required to try
              </p>
            </motion.div>
          </motion.div>

          <ScrollReveal delay={0.15} duration={0.8} amount={0} className="w-[95%] max-w-[1080px] mt-16 relative z-10">
            <InteractiveShowcase />
          </ScrollReveal>
        </section>

        {/* Features */}
        <section id="features" className="bg-surface-black py-section px-6 md:px-section-x">
          <div className="max-w-[1100px] mx-auto text-center mb-16 flex flex-col items-center gap-3">
            <Badge>Features</Badge>
            <h2 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight text-white">
              Everything you need for tech hiring
            </h2>
          </div>
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Realtime signaling"
              description="Sub-100ms peer connection signaling coordinates instant audio, video and compiler data transfers."
              iconName="activity"
              revealDelay={0}
            />
            <FeatureCard
              title="Whisper transcript"
              description="AI processes spoken audio and registers collaborative transcripts in real time across both participants."
              iconName="cpu"
              revealDelay={0.08}
            />
            <FeatureCard
              title="AI evaluation"
              description="Generate feedback maps covering code complexity, collaboration skills, and development areas automatically."
              iconName="shield"
              revealDelay={0.16}
            />
            <FeatureCard
              title="Proctoring AI"
              description="Passive focus detection monitors tab switches and window blur events, logging behavioral signals throughout the session."
              iconName="eye"
              revealDelay={0.24}
            />
            <FeatureCard
              title="Role-based access"
              description="Granular permission tiers for interviewers, candidates, and observers — each with a tailored, scoped view of the session."
              iconName="lock"
              revealDelay={0.32}
            />
            <FeatureCard
              title="Session recording"
              description="Automatic full-session recordings with synchronized audio, video, and code playback for async post-review by the hiring committee."
              iconName="video"
              revealDelay={0.40}
            />
          </div>
        </section>

        <HowItWorksSection />
        <PricingCalloutSection />
        <FAQSection />
        <PreFooterCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
