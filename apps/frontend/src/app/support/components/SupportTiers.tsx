'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, X, Shield, Zap, Crown, MessageSquare, Clock, Users, Bot, Phone } from 'lucide-react';
import { Card } from '../../../components/ui/Card';

interface Tier {
  name: string;
  icon: React.ElementType;
  price: string;
  color: string;
  borderColor: string;
  features: { name: string; included: boolean }[];
  sla: string;
  highlight?: boolean;
}

const tiers: Tier[] = [
  {
    name: 'Free',
    icon: Shield,
    price: '$0',
    color: 'text-body-muted/70',
    borderColor: 'border-white/[0.06]',
    sla: 'AI-only support',
    features: [
      { name: 'AI Support Agent', included: true },
      { name: 'Knowledge Base Access', included: true },
      { name: 'Community Forum', included: true },
      { name: 'Email Support', included: false },
      { name: 'Priority Queue', included: false },
      { name: 'Phone Support', included: false },
      { name: 'Dedicated Account Manager', included: false },
      { name: 'Custom Integration Support', included: false },
    ],
  },
  {
    name: 'Pro',
    icon: Zap,
    price: '$29',
    color: 'text-primary-on-dark',
    borderColor: 'border-primary/20',
    sla: '< 2 hours response',
    features: [
      { name: 'AI Support Agent', included: true },
      { name: 'Knowledge Base Access', included: true },
      { name: 'Community Forum', included: true },
      { name: 'Email Support', included: true },
      { name: 'Priority Queue', included: true },
      { name: 'Phone Support', included: false },
      { name: 'Dedicated Account Manager', included: false },
      { name: 'Custom Integration Support', included: false },
    ],
  },
  {
    name: 'Enterprise',
    icon: Crown,
    price: '$99',
    color: 'text-amber-400',
    borderColor: 'border-amber-400/20',
    sla: '< 30 min response',
    highlight: true,
    features: [
      { name: 'AI Support Agent', included: true },
      { name: 'Knowledge Base Access', included: true },
      { name: 'Community Forum', included: true },
      { name: 'Email Support', included: true },
      { name: 'Priority Queue', included: true },
      { name: 'Phone Support', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'Custom Integration Support', included: true },
    ],
  },
];

export function SupportTiers() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-h1 font-display font-semibold text-white">
          Support Tiers
        </h1>
        <p className="text-[13px] text-body-muted/60 mt-1">
          Choose the support level that fits your team
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {tiers.map((tier, index) => {
          const Icon = tier.icon;
          return (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {(() => {
                const Wrapper = tier.highlight ? Card : Card;
                const wrapperVariant = tier.highlight ? 'ghost' : 'default';
                return (
                  <Wrapper variant={wrapperVariant} padding="md" className="h-full flex flex-col">
                    {tier.highlight && (
                      <div className="flex items-center gap-1.5 mb-3">
                        <span className="text-[9px] font-mono font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-pill">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${tier.borderColor} ${tier.highlight ? 'bg-amber-400/10' : 'bg-white/[0.04]'}`}>
                        {tier.highlight ? (
                          <Icon className={`w-4.5 h-4.5 ${tier.color}`} />
                        ) : (
                          <span className="text-[12px] font-semibold text-body-muted/70">{tier.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <div className={`text-[15px] font-semibold ${tier.color}`}>{tier.name}</div>
                        <div className="text-[11px] text-body-muted/55">{tier.sla}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-[18px] font-display font-semibold text-white">{tier.price}</div>
                        <div className="text-[10px] text-body-muted/50 font-mono">/month</div>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      {tier.features.map((feature) => (
                        <div key={feature.name} className="flex items-center gap-2.5">
                          {feature.included ? (
                            <Check className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-body-muted/20 shrink-0" />
                          )}
                          <span className={`text-[12px] ${feature.included ? 'text-body-muted/70' : 'text-body-muted/50'}`}>
                            {feature.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Wrapper>
                );
              })()}
            </motion.div>
          );
        })}
      </div>

      {/* Enterprise CTA */}
      <Card variant="default" padding="md">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="w-10 h-10 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-[14px] font-semibold text-white">Need a custom plan?</h3>
            <p className="text-[12px] text-body-muted/50 mt-0.5">
              We offer custom SLAs, dedicated infrastructure, and white-label options for large organizations.
              Contact our sales team for a personalized quote.
            </p>
          </div>
          <button className="shrink-0 px-4 py-2 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 text-[12px] font-medium hover:bg-amber-400/20 transition-colors">
            Contact Sales
          </button>
        </div>
      </Card>
    </motion.div>
  );
}
