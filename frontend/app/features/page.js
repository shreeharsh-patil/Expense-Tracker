'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import DynamicIcon from '../../components/DynamicIcon';
import { ArrowRight, CheckCircle, HelpCircle, Star, Shield, Zap, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: 'LayoutDashboard',
    iconBg: 'from-[#eca8d6] to-[#a78bfa]',
    title: 'Smart Dashboard',
    description: 'Visualize your spending with beautiful, real-time charts. Track income vs expenses, monitor budgets, and get instant insights into your financial health.',
    tags: ['Real-time', 'Interactive'],
    span: 'md:col-span-2 lg:col-span-2',
    delay: 'delay-75',
    stat: '$14K avg. tracked/month'
  },
  {
    icon: 'Repeat',
    iconBg: 'from-emerald-500 to-emerald-400',
    title: 'Automated Tracking',
    description: 'Set recurring expenses and never miss a payment. Automatic monthly entries for subscriptions, rent, and regular bills.',
    tags: ['Auto renewals'],
    span: '',
    delay: 'delay-150',
    stat: '85% time saved'
  },
  {
    icon: 'ScanLine',
    iconBg: 'from-rose-500 to-pink-500',
    title: 'AI Receipt Scanner',
    description: 'Extract data instantly from your receipts using OCR technology. Snap a photo and let Spendly digitize it automatically.',
    tags: ['AI-assisted'],
    span: '',
    delay: 'delay-200',
    stat: '2.3s avg. scan'
  },
  {
    icon: 'TrendingUp',
    iconBg: 'from-blue-500 to-cyan-500',
    title: 'Budget Forecasting',
    description: 'Project your monthly burn rate and get early alerts when you\'re approaching budget limits. Stay in control.',
    tags: ['Daily projections'],
    span: '',
    delay: 'delay-200',
    stat: '92% accuracy'
  },
  {
    icon: 'Moon',
    iconBg: 'from-amber-500 to-orange-500',
    title: 'Obsidian Dark Mode',
    description: 'A beautiful, low-contrast dark mode designed to ease your eyes. Seamless transitions match your system preferences.',
    tags: ['Fluid theme sync'],
    span: '',
    delay: 'delay-150',
    stat: 'System-aware'
  },
  {
    icon: 'Download',
    iconBg: 'from-teal-500 to-emerald-500',
    title: 'Custom Exports & Reports',
    description: 'Download your data in CSV format for accounting. Generate detailed annual reports with category breakdowns, payment method analysis, and income vs spending trends.',
    tags: ['CSV Export', 'Analytics'],
    span: 'md:col-span-2 lg:col-span-3',
    delay: 'delay-300',
    stat: 'One-click export'
  }
];

const stats = [
  { value: '10K+', label: 'Active Users', icon: Star },
  { value: '50K+', label: 'Receipts Scanned', icon: Zap },
  { value: '99.9%', label: 'Uptime', icon: Shield },
  { value: '4.9★', label: 'App Rating', icon: Star },
];

const faqs = [
  {
    q: 'Is Spendly really free?',
    a: 'Yes! Our Hobbyist plan is free forever with 50 entries/month and 5 OCR scans. Upgrade to Pro when you need more.'
  },
  {
    q: 'Can I export my data?',
    a: 'Absolutely. You can download your complete transaction history as CSV at any time. Your data belongs to you.'
  },
  {
    q: 'Is my financial data secure?',
    a: 'All data is encrypted at rest and in transit. We use industry-standard AES-256 encryption and never share your data with third parties.'
  },
  {
    q: 'Does the OCR scanner work on all receipts?',
    a: 'The scanner works best on clear, well-lit receipts. It supports JPEG and PNG formats and extracts merchant, amount, and date automatically.'
  }
];

const planFeatures = [
  { feature: 'Monthly entries', free: '50/month', pro: 'Unlimited' },
  { feature: 'OCR scans', free: '5/month', pro: 'Unlimited' },
  { feature: 'Recurring rules', free: '1 rule', pro: 'Unlimited' },
  { feature: 'CSV export', free: '—', pro: '✓' },
  { feature: 'Budget alerts', free: 'Basic', pro: 'Advanced' },
  { feature: 'Priority support', free: '—', pro: '✓' },
];

function ChevronDown({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function FeaturesPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      {/* ─── Hero Section ─── */}
      <section className="relative pt-32 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto overflow-hidden">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="w-8 h-px bg-foreground/30" />
              Full Stack Engine
            </span>
            <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95]">
              Everything you need to{' '}
              <span className="text-muted-foreground">master your finances.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Spendly combines cutting-edge OCR ingestion with a lightweight transactional database to give you an uncompromised tracking system — from receipt to report in seconds.
            </p>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-8">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div
                  key={i}
                  className="p-5 border border-foreground/10 bg-foreground/[0.02] text-center transition-all duration-500 hover:border-foreground/30"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <Icon className="w-4 h-4 mx-auto mb-2 text-foreground/50" />
                  <p className="text-2xl font-display tracking-tight">{stat.value}</p>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Feature Bento Grid ─── */}
      <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto border-t border-foreground/10">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95]">
              Purpose-built for{' '}
              <span className="text-muted-foreground">financial clarity.</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Every feature is designed to reduce friction and give you real-time visibility into your money.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`p-8 border border-foreground/10 bg-foreground/[0.02] flex flex-col group hover:border-foreground/30 transition-all duration-500 ${feature.span}`}
                style={{ transitionDelay: `${100 + index * 80}ms` }}
              >
                {/* Icon with gradient */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconBg} text-white flex items-center justify-center mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                  <DynamicIcon name={feature.icon} className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-display mb-3 group-hover:text-[#eca8d6] transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
                  {feature.description}
                </p>

                {/* Stat micro-badge */}
                <div className="mt-4 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground/50 bg-foreground/[0.03] px-2 py-0.5">
                    <Zap className="w-2.5 h-2.5" />
                    {feature.stat}
                  </span>
                </div>

                {/* Tags */}
                <div className="pt-4 border-t border-foreground/10 flex items-center gap-2">
                  {feature.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Feature Comparison ─── */}
      <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto border-t border-foreground/10">
        <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="w-8 h-px bg-foreground/30" />
              Transparent Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95]">
              Free to start,{' '}
              <span className="text-muted-foreground">powerful to grow.</span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              No hidden fees, no surprise charges. Start with everything you need and upgrade when you outgrow it.
            </p>
          </div>

          <div className="border border-foreground/10 overflow-hidden bg-foreground/[0.02]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-foreground/10">
                  <th className="px-6 py-5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Feature</th>
                  <th className="px-6 py-5 text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">Free</th>
                  <th className="px-6 py-5 text-[10px] font-mono text-foreground uppercase tracking-widest text-center bg-foreground/[0.03]">Pro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-foreground/[0.04]">
                {planFeatures.map((item, i) => (
                  <tr key={i} className="hover:bg-foreground/[0.01] transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground/80">{item.feature}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground text-center font-mono">{item.free}</td>
                    <td className="px-6 py-4 text-sm text-foreground text-center font-mono bg-foreground/[0.03]">{item.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm font-medium transition-all group"
            >
              Start Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-foreground/20 hover:border-foreground/40 text-foreground rounded-full text-sm font-medium transition-all"
            >
              View Pricing Details
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto border-t border-foreground/10">
        <div className={`max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
              <span className="w-8 h-px bg-foreground/30" />
              <HelpCircle className="w-4 h-4" />
              Quick Answers
            </span>
            <h2 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95]">
              Frequently asked{' '}
              <span className="text-muted-foreground">questions.</span>
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details
                key={i}
                className="p-6 border border-foreground/10 bg-foreground/[0.02] group open:border-foreground/30 transition-all duration-300 cursor-pointer"
              >
                <summary className="flex items-center justify-between gap-4 text-sm font-medium text-foreground list-none cursor-pointer">
                  <span className="group-open:text-[#eca8d6] transition-colors">{faq.q}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-300 group-open:rotate-180" />
                </summary>
                <p className="mt-4 text-sm text-muted-foreground leading-relaxed border-t border-foreground/10 pt-4">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 px-6 lg:px-12 max-w-[1400px] mx-auto border-t border-foreground/10">
        <div className={`max-w-3xl mx-auto text-center space-y-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            No credit card required
          </span>

          <h2 className="text-5xl md:text-6xl font-display tracking-tight leading-[0.95]">
            Ready to take control of your{' '}
            <span className="text-muted-foreground">financial future</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Join thousands of users who have transformed their relationship with money. Start tracking, scanning, and forecasting in under 2 minutes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm font-medium transition-all group"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 border border-foreground/20 hover:border-foreground/40 text-foreground rounded-full text-sm font-medium transition-all"
            >
              Sign In
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-muted-foreground">
            <div className="flex items-center gap-1.5 text-[10px]">
              <Shield className="w-3.5 h-3.5 text-foreground/50" />
              AES-256 Encrypted
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              SOC 2 Compliant
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Star className="w-3.5 h-3.5 text-amber-500" fill="currentColor" />
              4.9★ App Rating
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <Zap className="w-3.5 h-3.5 text-foreground/50" />
              GDPR Compliant
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </main>
  );
}
