'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Check, Zap } from 'lucide-react';

const plans = [
  {
    name: 'Hobby',
    description: 'For personal expense tracking',
    price: { monthly: 0, annual: 0 },
    features: [
      'Up to 2 accounts',
      '50 manual entries/month',
      'Basic charts & aggregates',
      'Community support',
    ],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    description: 'For serious budgeters',
    price: { monthly: 249, annual: 199 },
    features: [
      'Unlimited accounts',
      'Unlimited receipt OCR scans',
      'Burn rate forecasts',
      'Subscription tracking',
      'CSV & PDF export',
      'Custom budget alerts',
      'Priority support',
    ],
    cta: 'Start trial',
    highlight: true,
  },
  {
    name: 'Family',
    description: 'For households & small teams',
    price: { monthly: null, annual: null },
    features: [
      'Everything in Pro',
      'Up to 5 family members',
      'Shared budgets',
      'Household reports',
      'Dedicated support',
      'Custom categories',
    ],
    cta: 'Contact us',
    highlight: false,
  },
];

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="pricing" ref={sectionRef} className="relative py-32 lg:py-40">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="grid lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-7">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-8">
              <span className="w-12 h-px bg-foreground/30" />
              Pricing
            </span>
            <h2 className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}>
              Transparent
              <br />
              <span className="text-stroke">pricing.</span>
            </h2>
          </div>
          
          <div className="lg:col-span-5 relative p-0 h-96 lg:h-auto">
            <div className={`absolute inset-0 pointer-events-none transition-all duration-1000 delay-100 ${
              isVisible ? 'opacity-100' : 'opacity-0'
            }`}>
              <img
                src="/images/whale.png"
                alt=""
                className="w-full h-full object-contain object-center"
              />
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-sm font-mono ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative w-14 h-7 rounded-full transition-colors ${isAnnual ? 'bg-foreground' : 'bg-foreground/20'}`}
          >
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-background transition-transform ${isAnnual ? 'translate-x-7.5' : 'translate-x-0.5'}`} />
          </button>
          <span className={`text-sm font-mono ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
            Annual
            <span className="text-[#eca8d6] ml-1 text-xs">Save 20%</span>
          </span>
        </div>

        {/* Pricing cards */}
        <div className="relative">
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-0">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className={`relative bg-background border transition-all duration-700 ${
                  plan.highlight 
                    ? 'border-foreground lg:-mx-2 lg:z-10 lg:scale-105' 
                    : 'border-foreground/10 lg:first:-mr-2 lg:last:-ml-2'
                } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-8 right-8 flex justify-center">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-mono uppercase tracking-widest">
                      <Zap className="w-3 h-3" />
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 lg:p-10">
                  <div className="mb-8 pb-8 border-b border-foreground/10">
                    <span className="font-mono text-xs text-muted-foreground">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-display mt-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                    {plan.price.monthly !== null ? (
                      <div className="flex items-baseline gap-2">
                        <span className="text-5xl lg:text-6xl font-display">
                          {plan.price.monthly === 0 ? 'Free' : `₹${isAnnual ? plan.price.annual : plan.price.monthly}`}
                        </span>
                        {plan.price.monthly > 0 && (
                          <span className="text-muted-foreground text-sm">/month</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-4xl font-display">Custom</span>
                    )}
                    {plan.price.monthly !== null && plan.price.monthly > 0 && (
                      <p className="text-xs text-muted-foreground mt-2 font-mono">
                        {isAnnual ? 'billed annually' : 'billed monthly'}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-10">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-[#eca8d6] mt-0.5 shrink-0" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.price.monthly === 0 ? '/register' : '/register'}
                    className={`w-full py-4 flex items-center justify-center gap-2 text-sm font-medium transition-all group ${
                      plan.highlight
                        ? 'bg-foreground text-background hover:bg-foreground/90'
                        : 'border border-foreground/20 text-foreground hover:border-foreground hover:bg-foreground/5'
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-20 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Encrypted data
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              No hidden fees
            </span>
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[#eca8d6]" />
              Cancel anytime
            </span>
          </div>
          <a href="/register" className="text-sm underline underline-offset-4 hover:text-foreground transition-colors">
            Compare all plans
          </a>
        </div>
      </div>

      <style jsx>{`
        .text-stroke {
          -webkit-text-stroke: 1.5px currentColor;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </section>
  );
}
