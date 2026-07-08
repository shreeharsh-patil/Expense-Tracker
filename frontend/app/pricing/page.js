'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Hobbyist',
    price: '₹0',
    period: 'Free forever',
    description: '',
    highlight: false,
    features: [
      'Up to 50 entries/month',
      '5 OCR scans/month',
      'Basic dashboard analytics',
      '1 recurring rule'
    ],
    cta: { text: 'Get Started Free', href: '/register', variant: 'btn-secondary' }
  },
  {
    name: 'Pro Ledger',
    price: '₹199',
    period: 'per month',
    description: 'Most Popular',
    highlight: true,
    features: [
      'Unlimited entries',
      'Unlimited OCR scans',
      'Advanced analytics & forecasts',
      'Unlimited recurring rules',
      'CSV data export',
      'Priority support'
    ],
    cta: { text: 'Start 14-Day Free Trial', href: '/register', variant: 'btn-primary' }
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'Contact us',
    description: '',
    highlight: false,
    features: [
      'Everything in Pro',
      'Team accounts',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    cta: { text: 'Contact Sales', href: 'mailto:sales@spendly.app', variant: 'btn-secondary' }
  }
];

export default function PricingPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">
          <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-canvas dark:bg-dark-bg transition-colors">
            <div className="glow-blob -top-20 left-1/3 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/15"></div>
            <div className="glow-blob -bottom-20 right-1/3 w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/15"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest">
                  Transparent Pricing
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                  Simple, <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">transparent pricing</span>.
                </h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-2xl mx-auto leading-relaxed">
                  Start for free, upgrade when you need more power. No hidden fees, no surprise charges.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto animate-fade-in-up delay-150">
                {plans.map((plan, index) => (
                  <div
                    key={index}
                    className={`card-apple p-8 flex flex-col hover-lift relative ${
                      plan.highlight
                        ? 'border-2 border-primary/30 dark:border-primary/50 shadow-xl shadow-primary/10 md:-translate-y-2 z-10 overflow-hidden'
                        : 'border-white/60 dark:border-white/5'
                    }`}
                  >
                    {plan.highlight && (
                      <>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-light"></div>
                        <div className="absolute -top-3 right-6 bg-gradient-to-r from-primary to-primary-light text-white text-[9px] font-bold px-4 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">
                          Most Popular
                        </div>
                      </>
                    )}

                    <p className={`text-[10px] font-mono font-bold uppercase tracking-widest mb-2 ${
                      plan.highlight ? 'text-primary' : 'text-slate-400'
                    }`}>
                      {plan.name}
                    </p>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-1">{plan.price}</p>
                    <p className="text-xs text-slate-400 dark:text-dark-mute mb-8">{plan.period}</p>

                    <ul className="space-y-4 mb-8 flex-1">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-dark-mute">
                          <CheckCircle className={`w-[18px] h-[18px] shrink-0 ${
                            plan.highlight ? 'text-primary' : 'text-emerald-500'
                          }`} />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {plan.cta.variant === 'btn-primary' ? (
                      <Link href={plan.cta.href} className="btn-primary w-full text-center py-3 text-sm font-bold shadow-xl shadow-primary/20">
                        {plan.cta.text}
                      </Link>
                    ) : (
                      plan.cta.href.startsWith('mailto:') ? (
                        <a href={plan.cta.href} className="btn-secondary w-full text-center py-3 text-sm font-bold inline-block">
                          {plan.cta.text}
                        </a>
                      ) : (
                        <Link href={plan.cta.href} className="btn-secondary w-full text-center py-3 text-sm font-bold">
                          {plan.cta.text}
                        </Link>
                      )
                    )}
                  </div>
                ))}
              </div>

              {/* Bento Guarantee Row */}
              <div className="mt-12 md:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto animate-fade-in-up delay-300">
                {/* Trust badges */}
                <div className="card-apple p-6 flex flex-col items-center text-center hover-lift bg-surface-soft dark:bg-dark-elevated border-white/60 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">14-Day Guarantee</h4>
                  <p className="text-[10px] text-slate-500 dark:text-dark-mute leading-relaxed">Full refund if not satisfied. No questions asked.</p>
                </div>

                <div className="card-apple p-6 flex flex-col items-center text-center hover-lift bg-surface-soft dark:bg-dark-elevated border-white/60 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Free Cancellation</h4>
                  <p className="text-[10px] text-slate-500 dark:text-dark-mute leading-relaxed">Cancel anytime, no long-term contracts.</p>
                </div>

                <div className="card-apple p-6 flex flex-col items-center text-center hover-lift bg-surface-soft dark:bg-dark-elevated border-white/60 dark:border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-3">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Secure Payment</h4>
                  <p className="text-[10px] text-slate-500 dark:text-dark-mute leading-relaxed">Your payment info is encrypted and safe.</p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
  );
}
