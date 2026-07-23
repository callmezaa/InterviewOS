'use client';

import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface MetricCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  delay?: number;
}

export function MetricCard({
  label, value, sub, icon,
  trend, trendUp, delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: delay * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 p-4 rounded-lg border border-white/[0.06] bg-white/[0.02] cursor-default select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-shrink-0 text-primary-on-dark">
          {icon}
        </div>

        {trend && (
          <Badge variant={trendUp ? 'primary' : 'neutral'} size="sm">
            <TrendingUp className={`w-2.5 h-2.5 ${trendUp ? '' : 'rotate-180'}`} />
            {trend}
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-[11px] text-body-muted/45 font-mono font-semibold leading-none">
          {label}
        </span>
        <span className="text-[28px] font-bold tracking-tight leading-none font-display text-white">
          {value}
        </span>
        <span className="text-[11px] text-body-muted/55 leading-none mt-0.5">{sub}</span>
      </div>
    </motion.div>
  );
}
