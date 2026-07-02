'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star } from 'lucide-react';
import { Badge } from './Badge';

// ── Testimonial data ─────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote:
      "InterviewOS transformed how we evaluate candidates — finally a platform built for engineers, by engineers. The AI transcript alone saves us 2 hours per hire.",
    name: 'Sarah Chen',
    role: 'Staff Engineer',
    company: 'Stripe',
    initials: 'SC',
    avatarColor: 'from-blue-600 to-blue-800',
    stars: 5,
  },
  {
    quote:
      "We cut our average interview setup time from 30 minutes to under 3. The live code editor with WebRTC is genuinely the best I've used in any interview tool.",
    name: 'Marcus Williams',
    role: 'Engineering Manager',
    company: 'Vercel',
    initials: 'MW',
    avatarColor: 'from-indigo-600 to-indigo-800',
    stars: 5,
  },
  {
    quote:
      "The AI evaluation report gives our hiring committee a shared language when debating candidates. Consistency across interviewers went up dramatically after we switched.",
    name: 'Priya Nair',
    role: 'Head of Engineering',
    company: 'Linear',
    initials: 'PN',
    avatarColor: 'from-sky-600 to-sky-800',
    stars: 5,
  },
];

// ── Star rating component ────────────────────────────────────────────────────
function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} className="w-3 h-3 fill-primary text-primary" />
      ))}
    </div>
  );
}

// ── Avatar initials fallback ─────────────────────────────────────────────────
function Avatar({ initials, gradient }: { initials: string; gradient: string }) {
  return (
    <div
      className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] flex-shrink-0`}
    >
      <span className="text-[12px] font-display font-semibold text-white/90 tracking-tight">
        {initials}
      </span>
    </div>
  );
}

// ── Card component ───────────────────────────────────────────────────────────
function TestimonialCard({
  testimonial,
  delay,
  isInView,
}: {
  testimonial: (typeof TESTIMONIALS)[0];
  delay: number;
  isInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="group flex flex-col gap-5 p-7 rounded-lg border border-white/[0.06] bg-white/[0.01] shadow-[inset_0_1.5px_0_rgba(255,255,255,0.04)] transition-all duration-500 hover:bg-white/[0.025]"
    >
      {/* Stars */}
      <StarRating count={testimonial.stars} />

      {/* Quote */}
      <blockquote className="text-[14px] sm:text-[15px] font-sans font-normal leading-[1.7] tracking-tight text-white/65 group-hover:text-white/80 transition-colors duration-300 flex-1">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>

      {/* Hairline divider */}
      <div className="h-px bg-white/[0.06] group-hover:bg-primary/15 transition-colors duration-500" />

      {/* Author info */}
      <div className="flex items-center gap-3">
        <Avatar initials={testimonial.initials} gradient={testimonial.avatarColor} />
        <div className="flex flex-col">
          <span className="text-[13px] font-semibold text-white group-hover:text-primary-on-dark transition-colors duration-300">
            {testimonial.name}
          </span>
          <span className="text-[11px] font-mono text-white/50 tracking-tight">
            {testimonial.role} · {testimonial.company}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Section export ───────────────────────────────────────────────────────────
export function TestimonialSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, amount: 0.15 });

  return (
    <section
      ref={ref}
      id="testimonials"
      className="bg-surface-black py-section px-6 md:px-section-x relative overflow-hidden"
    >
      <div className="max-w-[1100px] mx-auto flex flex-col gap-14">

        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center text-center gap-3"
        >
          <Badge>Testimonials</Badge>
          <h2 className="font-display font-semibold text-[32px] sm:text-[40px] leading-tight tracking-tight text-white mt-2">
            What engineering leaders say
          </h2>
          <p className="text-body-muted/45 text-[14px] sm:text-[15px] leading-relaxed max-w-[440px] font-sans tracking-tight">
            Trusted by hiring teams at high-growth engineering organizations.
          </p>
        </motion.div>

        {/* ── Testimonial Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard
              key={t.name}
              testimonial={t}
              delay={0.1 + i * 0.12}
              isInView={isInView}
            />
          ))}
        </div>

        {/* ── Trust badge row ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8"
        >
          {[
            { value: '4.9 / 5.0', label: 'Average rating' },
            { value: '98%', label: 'Would recommend' },
            { value: '10,000+', label: 'Sessions run' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="font-display font-bold text-[18px] text-white">{value}</span>
              <span className="text-[11px] font-mono text-white/25 tracking-tight">{label}</span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
