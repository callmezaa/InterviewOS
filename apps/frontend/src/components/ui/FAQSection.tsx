'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Badge } from './Badge';

const FAQS = [
  {
    question: 'Is our interview data secure?',
    answer:
      'Yes. InterviewOS is designed for B2B security from the start: encrypted sessions, tenant-scoped access, role-based permissions, and protected storage for recordings, transcripts, and code playback. Your interview data is never used to train public AI models.',
  },
  {
    question: 'How much does InterviewOS cost?',
    answer:
      'InterviewOS is free during the beta period with no credit card required. Paid plans will be seat-based for hiring teams, with custom pricing available for larger organizations that need SSO, compliance support, dedicated onboarding, or higher recording limits.',
  },
  {
    question: 'Can InterviewOS integrate with our ATS?',
    answer:
      'Yes. Teams can connect InterviewOS through webhooks and API workflows to send interview notes, AI evaluation summaries, candidate scorecards, and session links into their ATS. Native integrations for popular ATS platforms can be prioritized for enterprise customers.',
  },
  {
    question: 'Does it work for remote and on-site interviews?',
    answer:
      'Yes. InterviewOS works for remote, hybrid, and on-site technical interviews. Interviewers and candidates join from the browser with video, audio, code editor, transcript, and evaluation context in one shared session.',
  },
  {
    question: 'What coding environments are supported?',
    answer:
      'The live editor is built for common engineering interview workflows across languages such as JavaScript, TypeScript, Python, Go, Java, C++, and SQL. Teams can structure interviews around live coding, debugging, system design notes, or guided problem-solving.',
  },
  {
    question: 'How does the AI evaluation work?',
    answer:
      'After each session, InterviewOS can analyze the transcript, code activity, collaboration signals, and interviewer inputs to produce a structured evaluation. The goal is not to replace hiring judgment, but to make feedback more consistent, reviewable, and easier to compare across candidates.',
  },
];

function FAQItem({
  faq,
  index,
  isOpen,
  onToggle,
  isInView,
}: {
  faq: (typeof FAQS)[0];
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{ duration: 0.45, delay: 0.05 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className={`border-b border-white/[0.06] last:border-b-0 transition-colors duration-300 ${
        isOpen ? 'border-white/[0.06]' : ''
      }`}
    >
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className="group flex w-full items-center justify-between gap-6 py-5 text-left"
      >
        <span
          className={`font-display text-[15px] font-medium tracking-tight transition-colors duration-200 sm:text-[16px] ${
            isOpen ? 'text-white' : 'text-white/65 group-hover:text-white/90'
          }`}
        >
          {faq.question}
        </span>

        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
            isOpen
              ? 'border-primary/40 bg-primary/10 text-primary-on-dark'
              : 'border-white/[0.06] bg-white/[0.03] text-white/55 group-hover:border-white/[0.12] group-hover:text-white/60'
          }`}
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <p className="max-w-[680px] pb-5 font-sans text-[14px] leading-[1.75] tracking-tight text-body-muted/55 sm:text-[15px]">
              {faq.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.1 });
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

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
          <Badge className="w-fit">FAQ</Badge>
          <h2 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-white sm:text-[34px]">
            Common questions
          </h2>
          <p className="font-sans text-[13px] leading-relaxed tracking-tight text-body-muted/55 sm:text-[14px]">
            Get clarity on security, pricing, integrations, and evaluation workflows before your team starts.
          </p>
        </motion.div>

        <div className="flex flex-1 flex-col border-t border-white/[0.06]">
          {FAQS.map((faq, i) => (
            <FAQItem
              key={faq.question}
              faq={faq}
              index={i}
              isOpen={openIndex === i}
              onToggle={() => handleToggle(i)}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
