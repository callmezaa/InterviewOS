'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { FeatureIcon, type FeatureIconName } from './FeatureIcon';
import { Card, CardContent } from './Card';

interface FeatureCardProps {
  title: string;
  description: string;
  iconName: FeatureIconName;
  revealDelay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  iconName,
  revealDelay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const cardVariants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        delay: revealDelay,
        ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      },
    },
    hover: {
      y: -3,
      transition: { duration: 0.25, ease: 'easeOut' as const },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      whileHover="hover"
      className="h-full"
    >
      <Card className="group cursor-pointer h-full border-white/[0.06] bg-white/[0.015] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:bg-white/[0.03] hover:border-white/[0.12] transition-all duration-300">
        <CardContent className="flex flex-col gap-2.5 pt-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] flex items-center justify-center mb-2 transition-all duration-300 group-hover:from-white/[0.09] group-hover:border-white/[0.14]">
            <FeatureIcon name={iconName} className="w-[22px] h-[22px]" />
          </div>
          <h3 className="font-display font-semibold text-[17px] tracking-tight text-white group-hover:text-primary-on-dark transition-colors duration-300">
            {title}
          </h3>
          <p className="text-body-muted/60 text-[14px] leading-relaxed transition-colors duration-300 group-hover:text-body-muted/80">
            {description}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};
