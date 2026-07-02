'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '../../store/useInterviewStore';
import { Button } from '../../components/ui/Button';
import {
  Check, Zap, Building2, Users, ArrowLeft, Sparkles, Minus,
} from 'lucide-react';
import { API_URL } from '../../lib/config';

interface PlanFeature {
  text: string;
  included: boolean;
}

type BillingInterval = 'monthly' | 'yearly';

interface PlanPrice {
  monthly: number;
  yearly: number;
}

interface Plan {
  id: string;
  name: string;
  price: PlanPrice;
  description: string;
  features: PlanFeature[];
  highlight?: boolean;
  icon: React.ElementType;
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'FREE',
    name: 'Free',
    price: { monthly: 0, yearly: 0 },
    description: 'Perfect for trying out the platform.',
    icon: Sparkles,
    features: [
      { text: '1 interview per month', included: true },
      { text: 'Basic code editor', included: true },
      { text: 'Standard AI feedback', included: true },
      { text: '24h access to results', included: true },
      { text: 'Text-based chat', included: true },
      { text: 'Advanced AI analysis', included: false },
      { text: 'Custom interview templates', included: false },
      { text: 'Team management', included: false },
    ],
    cta: 'Get Started',
  },
  {
    id: 'PRO',
    name: 'Pro',
    price: { monthly: 29, yearly: 290 },
    description: 'For serious interview preparation.',
    icon: Zap,
    highlight: true,
    features: [
      { text: '10 interviews per month', included: true },
      { text: 'Full code editor', included: true },
      { text: 'Advanced AI feedback', included: true },
      { text: '7-day access to results', included: true },
      { text: 'Text & voice chat', included: true },
      { text: 'AI code analysis', included: true },
      { text: 'Custom interview templates', included: true },
      { text: 'Priority support', included: true },
      { text: 'Team management', included: false },
    ],
    cta: 'Subscribe',
  },
  {
    id: 'TEAM',
    name: 'Team',
    price: { monthly: 99, yearly: 990 },
    description: 'For small hiring teams.',
    icon: Users,
    features: [
      { text: 'Unlimited interviews', included: true },
      { text: 'Full code editor', included: true },
      { text: 'Advanced AI feedback', included: true },
      { text: 'Unlimited access to results', included: true },
      { text: 'Text, voice & video chat', included: true },
      { text: 'AI code analysis', included: true },
      { text: 'Custom interview templates', included: true },
      { text: 'Priority support', included: true },
      { text: 'Up to 5 team seats', included: true },
      { text: 'Shared template library', included: true },
    ],
    cta: 'Subscribe',
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    price: { monthly: 0, yearly: 0 },
    description: 'For organizations with advanced needs.',
    icon: Building2,
    features: [
      { text: 'Unlimited interviews', included: true },
      { text: 'Everything in Team', included: true },
      { text: 'Unlimited team seats', included: true },
      { text: 'SSO / SAML', included: true },
      { text: 'Custom AI models', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'SLA guarantee', included: true },
    ],
    cta: 'Contact Sales',
  },
];

function computeSavingsPercent(plan: Plan): number | null {
  if (!plan.price.monthly || !plan.price.yearly) return null;
  const yearlyIfMonthly = plan.price.monthly * 12;
  if (yearlyIfMonthly <= 0) return null;
  return Math.round((1 - plan.price.yearly / yearlyIfMonthly) * 100);
}

function computePerMonth(yearlyTotal: number): number {
  return Math.ceil(yearlyTotal / 12);
}

export default function PricingPage() {
  const router = useRouter();
  const { user } = useInterviewStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>('monthly');

  const handlePlanAction = async (plan: Plan) => {
    if (plan.id === 'FREE') {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/auth/register');
      }
      return;
    }

    if (plan.id === 'ENTERPRISE') {
      window.location.href = 'mailto:sales@interviewos.app';
      return;
    }

    if (!user) {
      router.push(`/auth/login?redirect=/pricing`);
      return;
    }

    setLoadingPlan(plan.id);
    try {
      const response = await fetch(`${API_URL}/billing/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan: plan.id, interval }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      alert(message);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-surface-black text-white">
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <Link
          href="/"
          className="text-[20px] font-bold tracking-tight"
        >
          Interview<span className="text-primary">OS</span>
        </Link>
        <nav className="flex items-center gap-4">
          {user ? (
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              Dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => router.push('/auth/login')}>
                Sign In
              </Button>
              <Button variant="primary" onClick={() => router.push('/auth/register')}>
                Get Started
              </Button>
            </>
          )}
        </nav>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-h1 font-display font-bold text-white mb-3">
            Simple, transparent pricing
          </h1>
          <p className="text-body-muted/60 text-[17px] max-w-xl mx-auto leading-relaxed">
            Start for free. Upgrade when you need more interviews, advanced AI analysis, or team features.
          </p>
        </div>

        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-white/[0.04] border border-white/[0.08] rounded-full p-1">
            <button
              onClick={() => setInterval('monthly')}
              className={`relative px-5 py-2 text-[14px] font-medium rounded-full transition-all duration-300 ${
                interval === 'monthly'
                  ? 'bg-primary text-white shadow-[0_2px_8px_-2px_rgba(0,102,204,0.3)]'
                  : 'text-body-muted/60 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setInterval('yearly')}
              className={`relative px-5 py-2 text-[14px] font-medium rounded-full transition-all duration-300 ${
                interval === 'yearly'
                  ? 'bg-primary text-white shadow-[0_2px_8px_-2px_rgba(0,102,204,0.3)]'
                  : 'text-body-muted/60 hover:text-white'
              }`}
            >
              Yearly
              {interval === 'yearly' && (
                <span className="absolute -top-2.5 -right-2.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_2px_6px_-1px_rgba(34,197,94,0.4)]">
                  Save
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isLoading = loadingPlan === plan.id;
            const isCustom = plan.id === 'ENTERPRISE' || plan.id === 'FREE';

            let displayPrice: string;
            let displayPeriod: string;
            let perMonth: number | null = null;
            let savingsPercent: number | null = null;

            if (isCustom) {
              displayPrice = plan.id === 'FREE' ? '$0' : 'Custom';
              displayPeriod = plan.id === 'FREE' ? '/forever' : '';
            } else if (interval === 'yearly') {
              displayPrice = `$${plan.price.yearly}`;
              displayPeriod = '/year';
              perMonth = computePerMonth(plan.price.yearly);
              savingsPercent = computeSavingsPercent(plan);
            } else {
              displayPrice = `$${plan.price.monthly}`;
              displayPeriod = '/month';
            }

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border transition-all duration-300 ${
                  plan.highlight
                    ? 'border-primary/40 bg-primary/[0.03] shadow-[0_0_30px_-8px_rgba(0,102,204,0.15)] scale-[1.02]'
                    : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-primary text-white text-[11px] font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                {savingsPercent && (
                  <div className="absolute -top-3 right-4 z-10">
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-[0_2px_8px_-2px_rgba(34,197,94,0.4)] inline-flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Save {savingsPercent}%
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      plan.highlight
                        ? 'bg-primary/10 border border-primary/20'
                        : 'bg-white/[0.03] border border-white/[0.06]'
                    }`}>
                      <Icon className={`w-5 h-5 ${
                        plan.highlight ? 'text-primary-on-dark' : 'text-body-muted/60'
                      }`} />
                    </div>
                    <div>
                      <h3 className="text-[17px] font-semibold text-white">{plan.name}</h3>
                      <div className="flex items-baseline gap-0.5">
                        <span className="text-[28px] font-bold tracking-tight text-white">
                          {displayPrice}
                        </span>
                        <span className="text-[13px] text-body-muted/50">{displayPeriod}</span>
                      </div>
                      {perMonth && (
                        <div className="text-[11px] text-body-muted/40 mt-0.5">
                          ${perMonth}/mo billed annually
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[13px] text-body-muted/60 mb-6 leading-relaxed">
                    {plan.description}
                  </p>

                  <div className="flex-1 space-y-2.5 mb-8">
                    {plan.features.map((feature) => (
                      <div key={feature.text} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Minus className="w-4 h-4 text-body-muted/30 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-[13px] ${
                          feature.included ? 'text-body-muted/80' : 'text-body-muted/40'
                        }`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    disabled={isLoading}
                    onClick={() => handlePlanAction(plan)}
                    className="w-full py-2.5 text-[14px]"
                  >
                    {isLoading ? 'Redirecting...' : plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
