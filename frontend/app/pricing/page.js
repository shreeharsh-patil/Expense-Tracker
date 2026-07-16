'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { CheckCircle, ShieldCheck, ArrowRight } from 'lucide-react';

const plans = [
  {
    name: 'Hobbyist',
    price: '₹0',
    period: 'Free forever',
    highlight: false,
    features: [
      'Up to 50 entries/month',
      '5 OCR scans/month',
      'Basic dashboard analytics',
      '1 recurring rule'
    ],
    cta: { text: 'Get Started Free', href: '/register' }
  },
  {
    name: 'Pro Ledger',
    price: '₹199',
    period: 'per month',
    highlight: true,
    features: [
      'Unlimited entries',
      'Unlimited OCR scans',
      'Advanced analytics & forecasts',
      'Unlimited recurring rules',
      'CSV data export',
      'Priority support'
    ],
    cta: { text: 'Start 14-Day Free Trial', href: '/register' }
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'Contact us',
    highlight: false,
    features: [
      'Everything in Pro',
      'Team accounts',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee'
    ],
    cta: { text: 'Contact Sales', href: 'mailto:sales@spendly.app' }
  }
];

export default function PricingPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <section className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="w-8 h-px bg-foreground/30" />
              Transparent Pricing
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95]">
              Simple,{' '}
              <span className="text-muted-foreground">transparent pricing.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Start for free, upgrade when you need more power. No hidden fees, no surprise charges.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`p-8 flex flex-col relative transition-all duration-500 ${
                  plan.highlight
                    ? 'border-2 border-foreground/30 bg-foreground/[0.03] -translate-y-0 md:-translate-y-2 z-10'
                    : 'border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/30'
                }`}
                style={{ transitionDelay: `${150 + index * 100}ms` }}
              >
                {plan.highlight && (
                  <>
                    <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-[#eca8d6] to-[#a78bfa]"></div>
                    <div className="absolute -top-3 right-6 bg-gradient-to-r from-[#eca8d6] to-[#a78bfa] text-background text-[9px] font-bold px-4 py-1 uppercase tracking-widest">
                      Most Popular
                    </div>
                  </>
                )}

                <p className={`text-[10px] font-mono uppercase tracking-widest mb-2 ${plan.highlight ? 'text-[#eca8d6]' : 'text-muted-foreground'}`}>
                  {plan.name}
                </p>
                <p className="text-4xl font-display mb-1">{plan.price}</p>
                <p className="text-xs text-muted-foreground mb-8">{plan.period}</p>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-foreground/70">
                      <CheckCircle className={`w-[18px] h-[18px] shrink-0 ${plan.highlight ? 'text-[#eca8d6]' : 'text-emerald-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.cta.href.startsWith('mailto:') ? (
                  <a
                    href={plan.cta.href}
                    className="inline-flex items-center justify-center w-full py-3 text-sm font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all text-center"
                  >
                    {plan.cta.text}
                  </a>
                ) : plan.highlight ? (
                  <Link
                    href={plan.cta.href}
                    className="inline-flex items-center justify-center w-full py-3 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all"
                  >
                    {plan.cta.text}
                  </Link>
                ) : (
                  <Link
                    href={plan.cta.href}
                    className="inline-flex items-center justify-center w-full py-3 text-sm font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all"
                  >
                    {plan.cta.text}
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Bento Guarantee Row */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 border border-foreground/10 bg-foreground/[0.02] flex flex-col items-center text-center hover:border-foreground/30 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5 text-foreground/60" />
              </div>
              <h4 className="text-xs font-medium text-foreground mb-1">14-Day Guarantee</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Full refund if not satisfied. No questions asked.</p>
            </div>

            <div className="p-6 border border-foreground/10 bg-foreground/[0.02] flex flex-col items-center text-center hover:border-foreground/30 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <polyline points="9 12 11 14 15 10"/>
                </svg>
              </div>
              <h4 className="text-xs font-medium text-foreground mb-1">Free Cancellation</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Cancel anytime, no long-term contracts.</p>
            </div>

            <div className="p-6 border border-foreground/10 bg-foreground/[0.02] flex flex-col items-center text-center hover:border-foreground/30 transition-all duration-500">
              <div className="w-10 h-10 rounded-xl bg-foreground/[0.05] flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-foreground/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h4 className="text-xs font-medium text-foreground mb-1">Secure Payment</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Your payment info is encrypted and safe.</p>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
