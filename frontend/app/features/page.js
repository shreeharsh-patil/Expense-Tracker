'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { LayoutDashboard, Repeat, ScanLine, TrendingUp, Download, Moon, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: LayoutDashboard,
    iconBg: 'bg-primary/10 text-primary dark:text-primary-light',
    title: 'Smart Dashboard',
    description: 'Visualize your spending with beautiful, real-time charts. Track income vs expenses, monitor budgets, and get instant insights into your financial health.',
    tags: [
      { label: 'Real-time', className: 'tag-badge tag-health' },
      { label: 'Interactive', className: 'tag-badge tag-other' }
    ],
    span: 'md:col-span-2 lg:col-span-2'
  },
  {
    icon: Repeat,
    iconBg: 'bg-emerald-500/10 text-emerald-500',
    title: 'Automated Tracking',
    description: 'Set recurring expenses and never miss a payment. Automatic monthly entries for subscriptions, rent, and regular bills.',
    tags: [
      { label: 'Auto renewals', className: 'tag-badge tag-bills' }
    ],
    span: ''
  },
  {
    icon: ScanLine,
    iconBg: 'bg-rose-500/10 text-rose-500',
    title: 'AI Receipt Scanner',
    description: 'Extract data instantly from your receipts using OCR technology. Snap a photo and let Spendly digitize it automatically.',
    tags: [
      { label: 'AI-assisted', className: 'tag-badge tag-health' }
    ],
    span: ''
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-blue-500/10 text-blue-500',
    title: 'Budget Forecasting',
    description: 'Project your monthly burn rate and get early alerts when you\'re approaching budget limits. Stay in control.',
    tags: [
      { label: 'Daily projections', className: 'tag-badge tag-food' }
    ],
    span: ''
  },
  {
    icon: Moon,
    iconBg: 'bg-amber-500/10 text-amber-500',
    title: 'Obsidian Dark Mode',
    description: 'A beautiful, low-contrast dark mode designed to ease your eyes. Seamless transitions match your system preferences.',
    tags: [
      { label: 'Fluid theme sync', className: 'tag-badge tag-transport' }
    ],
    span: ''
  },
  {
    icon: Download,
    iconBg: 'bg-teal-500/10 text-teal-500',
    title: 'Custom Exports & Reports',
    description: 'Download your data in CSV format for accounting. Generate detailed annual reports with category breakdowns, payment method analysis, and income vs spending trends.',
    tags: [
      { label: 'CSV Export', className: 'tag-badge tag-transport' },
      { label: 'Analytics', className: 'tag-badge tag-shopping' }
    ],
    span: 'md:col-span-2 lg:col-span-3'
  }
];

export default function FeaturesPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">
          <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-canvas dark:bg-dark-bg transition-colors">
            <div className="glow-blob -top-20 -left-20 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/15"></div>
            <div className="glow-blob -bottom-20 -right-20 w-[500px] h-[500px] bg-rose-500/10 dark:bg-rose-500/15"></div>

            <div className="max-w-7xl mx-auto relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-light text-[10px] font-mono font-bold uppercase tracking-widest">
                  Full Stack Engine
                </div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                  Everything you need to <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">master your finances</span>.
                </h1>
                <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-2xl mx-auto leading-relaxed">
                  Spendly combines cutting-edge OCR ingestion with a lightweight transactional database to give you an uncompromised tracking system.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8 animate-fade-in-up delay-150">
                {features.map((feature, index) => (
                  <div key={index} className={`card-apple p-6 md:p-8 flex flex-col hover-lift ${feature.span}`}>
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-5`}>
                      <feature.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{feature.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-dark-mute flex-1 leading-relaxed">{feature.description}</p>
                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-dark-border/40 flex items-center gap-2">
                      {feature.tags.map((tag, i) => (
                        <span key={i} className={tag.className}>{tag.label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-20 md:mt-24 text-center animate-fade-in-up delay-300">
                <div className="card-apple p-10 md:p-12 max-w-2xl mx-auto shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
                  <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">Ready to take control?</h2>
                  <p className="text-sm text-slate-500 dark:text-dark-mute mb-8 max-w-md mx-auto">Start tracking your expenses today with our free plan. No credit card required.</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/register" className="btn-primary px-8 py-3 text-sm font-bold shadow-xl shadow-primary/20 inline-flex items-center justify-center gap-2 group">
                      Get Started Free
                      <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                    </Link>
                    <Link href="/login" className="btn-secondary px-8 py-3 text-sm font-bold inline-flex items-center justify-center">
                      Sign In
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
  );
}
