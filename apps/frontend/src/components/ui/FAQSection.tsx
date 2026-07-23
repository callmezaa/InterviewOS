'use client';

import { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { Badge } from './Badge';
import { BouncyAccordion } from '../motion/bouncy-accordion';

const FAQS = [
  {
    id: 'secure',
    title: 'Is our interview data secure?',
    description:
      'Yes. InterviewOS is designed for B2B security from the start: encrypted sessions, tenant-scoped access, role-based permissions, and protected storage for recordings, transcripts, and code playback. Your interview data is never used to train public AI models.',
  },
  {
    id: 'free',
    title: 'Is InterviewOS free to use?',
    description:
      'Yes. InterviewOS is completely free during the beta period. You can run real engineering interviews with video, code playback, transcripts, and AI-assisted evaluation at no cost.',
  },
  {
    id: 'ats',
    title: 'Can InterviewOS integrate with our ATS?',
    description:
      'Yes. Teams can connect InterviewOS through webhooks and API workflows to send interview notes, AI evaluation summaries, candidate scorecards, and session links into their ATS. Native integrations for popular ATS platforms can be prioritized for enterprise customers.',
  },
  {
    id: 'remote',
    title: 'Does it work for remote and on-site interviews?',
    description:
      'Yes. InterviewOS works for remote, hybrid, and on-site technical interviews. Interviewers and candidates join from the browser with video, audio, code editor, transcript, and evaluation context in one shared session.',
  },
  {
    id: 'environments',
    title: 'What coding environments are supported?',
    description:
      'The live editor is built for common engineering interview workflows across languages such as JavaScript, TypeScript, Python, Go, Java, C++, and SQL. Teams can structure interviews around live coding, debugging, system design notes, or guided problem-solving.',
  },
  {
    id: 'evaluation',
    title: 'How does the AI evaluation work?',
    description:
      'After each session, InterviewOS can analyze the transcript, code activity, collaboration signals, and interviewer inputs to produce a structured evaluation. The goal is not to replace hiring judgment, but to make feedback more consistent, reviewable, and easier to compare across candidates.',
  },
];

export function FAQSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const [activeValue, setActiveValue] = useState<string | null>('secure');

  return (
    <section
      id="faq"
      ref={ref}
      className="scroll-mt-20 bg-surface-black px-6 py-section md:px-section-x"
    >
      <div className="mx-auto flex max-w-[1100px] flex-col gap-16 lg:flex-row lg:gap-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-shrink-0 flex-col gap-4 lg:w-[280px] lg:pt-1"
        >
          <Badge variant="secondary" className="w-fit">FAQ</Badge>
          <h2 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[34px]">
            Common questions
          </h2>
          <p className="font-sans text-[13px] leading-relaxed tracking-tight text-body-muted/55 sm:text-[14px]">
            Get clarity on security, integrations, and evaluation workflows before your team starts.
          </p>
        </motion.div>

        <div className="flex flex-1 flex-col">
          <BouncyAccordion
            items={FAQS}
            value={activeValue}
            onValueChange={setActiveValue}
            collapsible
            classNames={{
              item: 'border border-white/[0.06] bg-white/[0.015] mb-3 last:mb-0',
            }}
          />
        </div>
      </div>
    </section>
  );
}
