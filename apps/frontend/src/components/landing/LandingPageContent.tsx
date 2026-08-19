'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, useScroll, useMotionValueEvent } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
import { ScrollReveal } from '../ui/ScrollReveal';
import { TextReveal } from '../motion/text-reveal';
import { useActiveSection } from '../../hooks/useActiveSection';

const InteractiveShowcase = dynamic(
  () => import('../ui/InteractiveShowcase').then((m) => m.InteractiveShowcase),
  { ssr: false }
);
const HowItWorksSection = dynamic(
  () => import('../ui/HowItWorksSection').then((m) => m.HowItWorksSection),
  { ssr: false }
);
const TestimonialSection = dynamic(
  () => import('../ui/TestimonialSection').then((m) => m.TestimonialSection),
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

const FeatureCard = dynamic(
  () => import('../ui/FeatureCard').then((m) => m.FeatureCard),
  { ssr: false }
);

export default function LandingPageContent() {
  const activeSection = useActiveSection(['features', 'how-it-works', 'testimonials', 'faq']);
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled(y > 80);
  });

  return (
    <div className="flex flex-col min-h-screen bg-surface-black text-white selection:bg-primary selection:text-white">
      {/* Global Navigation */}
      <header
        className={`sticky top-0 z-50 h-14 flex items-center justify-between px-6 md:px-12 transition-all duration-500 ${
          scrolled
            ? 'bg-surface-black/80 backdrop-blur-md border-b border-white/[0.06]'
            : 'bg-surface-black/0'
        }`}
      >
        <Link href="/" className="flex items-center gap-2.5 select-none group/logo">
          <Image
            src="/logo/logo_white.png"
            alt="InterviewOS"
            width={28}
            height={28}
            className="block shrink-0"
            priority
          />
          <span className="font-display font-semibold text-[15px] tracking-tight text-white/90 group-hover/logo:text-white transition-colors duration-200">
            InterviewOS
          </span>
        </Link>

        <nav className="hidden md:flex items-center justify-center gap-8 select-none">
          {([
            { label: 'Features',    href: '#features',     id: 'features' },
            { label: 'How it works', href: '#how-it-works', id: 'how-it-works' },
            { label: 'Testimonials', href: '#testimonials', id: 'testimonials' },
            { label: 'FAQ',          href: '#faq',          id: 'faq' },
          ] as const).map(({ label, href, id }) => {
            const isActive = activeSection === id;
            return (
              <a
                key={id}
                href={href}
                className="relative text-[13px] font-medium text-white/40 hover:text-white transition-colors duration-300 group/link"
              >
                {label}
                <span
                  className={`absolute -bottom-1 left-1/2 -translate-x-1/2 h-px bg-white transition-all duration-300 ${
                    isActive
                      ? 'w-full opacity-100'
                      : 'w-0 opacity-0 group-hover/link:w-full group-hover/link:opacity-60'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        <Link href="/auth/login">
          <Button variant="ghost" size="sm">
            Sign In
          </Button>
        </Link>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-section min-h-[85vh] overflow-hidden bg-surface-black">
          <motion.div
            className="max-w-[860px] flex flex-col items-center gap-5 relative z-10"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.13, delayChildren: 0.1 } },
            }}
          >
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <TextReveal
                text="The OS for"
                as="span"
                stagger={0.05}
                blur={8}
                yOffset="30%"
                className="block font-display font-bold text-[46px] sm:text-[66px] leading-[1.05] tracking-[-0.04em] text-white"
              />
            </motion.div>

            <motion.div
              className="overflow-hidden -mt-2"
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <h1 className="font-display font-bold text-[46px] sm:text-[66px] leading-[1.05] tracking-[-0.04em] text-white/85">
                technical interviews.
              </h1>
            </motion.div>

            <motion.p
              className="max-w-[540px] text-[17px] sm:text-[19px] font-normal leading-[1.55] text-body-muted/60 tracking-[-0.01em] mt-1"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              Combining WebRTC video calls, synchronized code editors, and live Whisper-transcription loops.
            </motion.p>

            <motion.div
              className="flex flex-col sm:flex-row items-center gap-6 mt-6"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
              }}
            >
              <Link href="/auth/login" className="group/cta relative inline-flex">
                <span className="relative flex items-center justify-center gap-2 h-[52px] px-9 rounded-full text-[15px] font-semibold tracking-tight text-white select-none bg-gradient-to-b from-[#0d86ff] to-[#0062c4] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),inset_0_-2px_4px_rgba(0,20,60,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#1890ff] hover:to-[#0a66ce] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-3px_6px_rgba(0,20,60,0.3)] active:translate-y-px active:shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_2px_6px_rgba(0,20,60,0.4)]">
                  Get Started
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                </span>
              </Link>

              <Link href="/auth/login" className="group/learn text-primary-on-dark flex items-center gap-1.5 font-sans text-[17px] tracking-tight hover:text-white transition-colors duration-200">
                Learn more
                <span className="inline-block text-[15px] transition-transform duration-300 ease-out group-hover/learn:translate-x-1.5">
                  →
                </span>
              </Link>
            </motion.div>
          </motion.div>

          <ScrollReveal delay={0.15} duration={0.8} amount={0} className="w-[95%] max-w-[1080px] mt-16 relative z-10">
            <InteractiveShowcase />
          </ScrollReveal>
        </section>

        {/* Features */}
        <section id="features" className="bg-surface-black py-section px-6 md:px-section-x">
          <div className="max-w-[1100px] mx-auto text-center mb-16 flex flex-col items-center gap-3">
            <span className="inline-flex items-center h-7 px-4 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase text-primary-on-dark bg-gradient-to-b from-[#0d3057] to-[#071d38] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.35)]">
              Features
            </span>
            <h2 className="font-display font-bold text-[32px] sm:text-[40px] leading-tight tracking-tight text-white">
              Everything you need for tech hiring
            </h2>
          </div>
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              title="Realtime signaling"
              description="Sub-100ms signaling syncs audio, video, and compiler data in real time."
              iconName="activity"
              revealDelay={0}
            />
            <FeatureCard
              title="Whisper transcript"
              description="Live Whisper transcription turns spoken audio into a shared transcript."
              iconName="cpu"
              revealDelay={0.08}
            />
            <FeatureCard
              title="AI evaluation"
              description="AI feedback maps code complexity, collaboration, and growth areas."
              iconName="shield"
              revealDelay={0.16}
            />
            <FeatureCard
              title="Proctoring AI"
              description="Tracks tab switches and window blur to log focus during the session."
              iconName="eye"
              revealDelay={0.24}
            />
            <FeatureCard
              title="Role-based access"
              description="Granular tiers give interviewers, candidates, and observers scoped views."
              iconName="lock"
              revealDelay={0.32}
            />
            <FeatureCard
              title="Session recording"
              description="Synchronized audio, video, and code playback for async review."
              iconName="video"
              revealDelay={0.4}
            />
          </div>
        </section>

        <HowItWorksSection />
        <TestimonialSection />
        <FAQSection />
        <PreFooterCTA />
      </main>

      <SiteFooter />
    </div>
  );
}
