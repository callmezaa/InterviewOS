'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';

interface AuthLayoutProps {
  children: React.ReactNode;
  heading?: string;
}

export function AuthLayout({ children, heading }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-black text-white flex flex-col">
      <div className="px-6 pt-6 pb-2">
        <Link href="/" className="flex items-center gap-2.5 group/logo w-fit">
          <Image
            src="/logo/logo_white.png"
            alt="InterviewOS"
            width={24}
            height={24}
            className="block shrink-0"
            priority
          />
          <span className="font-display font-semibold text-[14px] tracking-tight text-white/60 group-hover/logo:text-white/90 transition-colors duration-200">
            InterviewOS
          </span>
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 pb-12">
        <motion.div
          className="w-full max-w-[380px]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {heading && (
            <h2 className="font-display font-bold text-[22px] leading-tight tracking-tight text-white mb-8">
              {heading}
            </h2>
          )}

          {children}
        </motion.div>
      </div>
    </div>
  );
}
