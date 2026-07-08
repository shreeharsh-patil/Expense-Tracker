import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import DynamicIcon from '../../components/DynamicIcon';
import { ArrowRight, CheckCircle, Download, HelpCircle, Shield, Star, Zap } from 'lucide-react';

const features = [
  {
    icon: 'LayoutDashboard',
    iconBg: 'from-indigo-500 to-primary',
    title: 'Smart Dashboard',
    description: 'Visualize your spending with beautiful, real-time charts. Track income vs expenses, monitor budgets, and get instant insights into your financial health.',
    tags: [
      { label: 'Real-time', className: 'tag-badge tag-health' },
      { label: 'Interactive', className: 'tag-badge tag-other' }
    ],
    span: 'md:col-span-2 lg:col-span-2',
    delay: 'delay-75',
    stat: '$14K avg. tracked/month'
  },
  {
    icon: 'Repeat',
    iconBg: 'from-emerald-500 to-emerald-400',
    title: 'Automated Tracking',
    description: 'Set recurring expenses and never miss a payment. Automatic monthly entries for subscriptions, rent, and regular bills.',
    tags: [
      { label: 'Auto renewals', className: 'tag-badge tag-bills' }
    ],
    span: '',
    delay: 'delay-150',
    stat: '85% time saved'
  },
  {
    icon: 'ScanLine',
    iconBg: 'from-rose-500 to-pink-500',
    title: 'AI Receipt Scanner',
    description: 'Extract data instantly from your receipts using OCR technology. Snap a photo and let Spendly digitize it automatically.',
    tags: [
      { label: 'AI-assisted', className: 'tag-badge tag-health' }
    ],
    span: '',
    delay: 'delay-200',
    stat: '2.3s avg. scan'
  },
  {
    icon: 'TrendingUp',
    iconBg: 'from-blue-500 to-cyan-500',
    title: 'Budget Forecasting',
    description: 'Project your monthly burn rate and get early alerts when you\'re approaching budget limits. Stay in control.',
    tags: [
      { label: 'Daily projections', className: 'tag-badge tag-food' }
    ],
    span: '',
    delay: 'delay-200',
    stat: '92% accuracy'
  },
  {
    icon: 'Moon',
    iconBg: 'from-amber-500 to-orange-500',
    title: 'Obsidian Dark Mode',
    description: 'A beautiful, low-contrast dark mode designed to ease your eyes. Seamless transitions match your system preferences.',
    tags: [
      { label: 'Fluid theme sync', className: 'tag-badge tag-transport' }
    ],
    span: '',
    delay: 'delay-150',
    stat: 'System-aware'
  },
  {
    icon: 'Download',
    iconBg: 'from-teal-500 to-emerald-500',
    title: 'Custom Exports & Reports',
    description: 'Download your data in CSV format for accounting. Generate detailed annual reports with category breakdowns, payment method analysis, and income vs spending trends.',
    tags: [
      { label: 'CSV Export', className: 'tag-badge tag-transport' },
      { label: 'Analytics', className: 'tag-badge tag-shopping' }
    ],
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

export default function FeaturesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow">
        {/* ─── Hero Section ─── */}
        <section className="relative py-20 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-canvas dark:bg-dark-bg transition-colors border-b border-slate-200/50 dark:border-dark-border/40">
          <div className="glow-blob -top-20 -left-20 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/15"></div>
          <div className="glow-blob -bottom-20 -right-20 w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/15"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16 space-y-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-light text-[10px] font-mono font-bold uppercase tracking-widest animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Full Stack Engine
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight leading-tight">
                Everything you need to{' '}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary-light to-rose-500 animate-fade-in">
                  master your finances
                </span>
                .
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-2xl mx-auto leading-relaxed">
                Spendly combines cutting-edge OCR ingestion with a lightweight transactional database to give you an uncompromised tracking system — from receipt to report in seconds.
              </p>
            </div>

            {/* ─── Stats Bar ─── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-3xl mx-auto mb-8 animate-fade-in-up delay-150">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div key={i} className="card-apple px-4 py-4 md:py-5 text-center hover-lift border-white/60 dark:border-white/5">
                    <Icon className="w-4 h-4 mx-auto mb-1.5 text-primary dark:text-primary-light" />
                    <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
                      {stat.value}
                    </p>
                    <p className="text-[9px] font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mt-0.5">
                      {stat.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Feature Bento Grid ─── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-surface-soft dark:bg-dark-elevated transition-colors">
          <div className="glow-blob top-1/4 -left-20 w-[400px] h-[400px] bg-primary/5 dark:bg-primary/10"></div>
          <div className="glow-blob bottom-1/4 -right-20 w-[400px] h-[400px] bg-rose-500/5 dark:bg-rose-500/10"></div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16 space-y-4 animate-fade-in-up">
              <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                Purpose-built for <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">financial clarity</span>.
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute leading-relaxed">
                Every feature is designed to reduce friction and give you real-time visibility into your money.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`card-apple p-6 md:p-8 flex flex-col group hover-lift transition-all duration-500 ${feature.span} animate-fade-in-up ${feature.delay}`}
                >
                  {/* Icon with gradient */}
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.iconBg} text-white flex items-center justify-center mb-5 shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                    <DynamicIcon name={feature.icon} className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2 group-hover:text-primary dark:group-hover:text-primary-light transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-dark-mute flex-1 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Stat micro-badge */}
                  <div className="mt-4 mb-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-mono font-bold text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10 px-2 py-0.5 rounded-full">
                      <Zap className="w-2.5 h-2.5" />
                      {feature.stat}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="pt-4 border-t border-slate-100 dark:border-dark-border/40 flex items-center gap-2">
                    {feature.tags.map((tag, i) => (
                      <span key={i} className={`${tag.className} transition-all duration-300 group-hover:scale-105`}>
                        {tag.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Feature Comparison ─── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-canvas dark:bg-dark-bg transition-colors border-t border-slate-200/50 dark:border-dark-border/40">
          <div className="max-w-4xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest">
                Transparent Pricing
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                Free to start, powerful to grow.
              </h2>
              <p className="text-sm text-slate-500 dark:text-dark-mute leading-relaxed">
                No hidden fees, no surprise charges. Start with everything you need and upgrade when you outgrow it.
              </p>
            </div>

            <div className="card-apple p-0 overflow-hidden border-white/60 dark:border-white/5 animate-fade-in-up delay-150 shadow-xl shadow-slate-200/40 dark:shadow-none">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-dark-border/40">
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest">Feature</th>
                    <th className="px-6 py-5 text-xs font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest text-center">Free</th>
                    <th className="px-6 py-5 text-xs font-bold text-primary uppercase tracking-widest text-center bg-primary/5 dark:bg-primary/10">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-dark-border/10">
                  {planFeatures.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">{item.feature}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-dark-mute text-center font-mono">{item.free}</td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-white text-center font-mono font-bold bg-primary/5 dark:bg-primary/10">{item.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 animate-fade-in-up delay-300">
              <Link href="/register" className="btn-primary px-8 py-3 text-sm font-bold shadow-xl shadow-primary/20 inline-flex items-center justify-center gap-2 group">
                Start Free
                <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/pricing" className="btn-secondary px-8 py-3 text-sm font-bold inline-flex items-center justify-center">
                View Pricing Details
              </Link>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-surface-soft dark:bg-dark-elevated transition-colors border-t border-slate-200/50 dark:border-dark-border/40">
          <div className="max-w-3xl mx-auto relative z-10">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-4 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-light text-[10px] font-mono font-bold uppercase tracking-widest">
                <HelpCircle className="w-3 h-3" />
                Quick Answers
              </div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                Frequently asked questions.
              </h2>
            </div>

            <div className="space-y-3 animate-fade-in-up delay-150">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="card-apple p-5 md:p-6 group open:border-primary/30 dark:open:border-primary/50 transition-all duration-300 border-white/60 dark:border-white/5 cursor-pointer"
                >
                  <summary className="flex items-center justify-between gap-4 text-sm font-bold text-slate-900 dark:text-white list-none cursor-pointer">
                    <span className="group-open:text-primary dark:group-open:text-primary-light transition-colors">{faq.q}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 group-open:rotate-180" />
                  </summary>
                  <p className="mt-4 text-sm text-slate-500 dark:text-dark-mute leading-relaxed border-t border-slate-100 dark:border-dark-border/40 pt-4">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Section ─── */}
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-canvas dark:bg-dark-bg transition-colors border-t border-slate-200/50 dark:border-dark-border/40">
          <div className="glow-blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-rose-500/5 dark:from-primary/10 dark:to-rose-500/10"></div>

          <div className="max-w-3xl mx-auto relative z-10 text-center space-y-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-mono font-bold uppercase tracking-widest">
              <CheckCircle className="w-3 h-3" />
              No credit card required
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight leading-tight">
              Ready to take control of your{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">financial future</span>?
            </h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-xl mx-auto leading-relaxed">
              Join thousands of users who have transformed their relationship with money. Start tracking, scanning, and forecasting in under 2 minutes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/register"
                className="btn-primary px-10 py-4 text-sm font-bold shadow-2xl shadow-primary/30 inline-flex items-center justify-center gap-2 group rounded-full"
              >
                Get Started Free
                <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="btn-secondary px-10 py-4 text-sm font-bold inline-flex items-center justify-center rounded-full"
              >
                Sign In
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-slate-400 dark:text-dark-mute">
              <div className="flex items-center gap-1.5 text-[10px]">
                <Shield className="w-3.5 h-3.5 text-primary" />
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
                <Zap className="w-3.5 h-3.5 text-primary" />
                GDPR Compliant
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />


    </div>
  );
}

function ChevronDown({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
