'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { Activity, Cpu, Shield, Eye, Lock, Video } from 'lucide-react';
import { Card, CardContent } from './Card';

interface FeatureCardProps {
  title: string;
  description: string;
  iconName: 'activity' | 'cpu' | 'shield' | 'eye' | 'lock' | 'video';
  revealDelay?: number;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  iconName,
  revealDelay = 0,
}) => {
  const iconsMap = {
    activity: Activity,
    cpu: Cpu,
    shield: Shield,
    eye: Eye,
    lock: Lock,
    video: Video,
  };
  const IconComponent = iconsMap[iconName];

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
      y: -4,
      transition: { duration: 0.25, ease: 'easeOut' as const },
    },
  };

  const iconVariants = {
    visible: { scale: 1 },
    hover: {
      scale: 1.1,
      transition: {
        type: 'spring' as const,
        stiffness: 300,
        damping: 10,
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      whileHover="hover"
    >
      <Card className="group cursor-pointer border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.03] hover:border-primary/20 transition-all duration-300">
        <CardContent className="flex flex-col gap-3 pt-6">
          <motion.div
            variants={iconVariants}
            className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-2 transition-all duration-300 group-hover:bg-primary/20"
          >
            {IconComponent && <IconComponent className="w-5 h-5 text-primary-on-dark" />}
          </motion.div>
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
