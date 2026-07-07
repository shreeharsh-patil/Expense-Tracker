'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AuthProvider } from '../components/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import LiveSimulator from '../components/LiveSimulator';
import { ArrowRight, Terminal, Sparkles, Star, CheckCircle, Shield, Brain, Cpu, Rocket } from 'lucide-react';

export default function Home() {
  return (
    <AuthProvider>
      <div className="flex flex-col min-h-screen">
        <Header />

        <main id="main-content" className="flex-grow">
          {/* Hero Section */}
          <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center py-12 md:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-grid-pattern">
            {/* Glowing Background Blobs */}
            <div className="glow-blob top-16 left-8 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-indigo-500/10 dark:bg-indigo-500/15" />
            <div className="glow-blob bottom-16 right-8 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-rose-500/10 dark:bg-rose-500/15" />

            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-8 items-center relative z-10">
              {/* Left Column */}
              <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6 md:space-y-8 animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary dark:text-primary-light text-[10px] font-mono font-bold uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
                  Personal Ledger Terminal
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-slate-900 dark:text-white font-extrabold tracking-tight leading-tight md:leading-[1.15]">
                  Track Smarter.<br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light">Spend Wiser.</span>
                </h1>

                <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-[500px] leading-relaxed">
                  Meet Spendly — the minimalist, privacy-first personal expense tracker designed to sync with your financial ledger. Scan receipts, forecast monthly burn, track subscriptions, and visualize cash flow automatically.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full sm:w-auto">
                  <Link href="/register" className="btn-primary w-full sm:w-auto py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group">
                    Get Started (Free)
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  </Link>
                  <a href="#live-demo" className="btn-secondary w-full sm:w-auto py-3.5 text-sm font-bold flex items-center justify-center gap-2">
                    <Terminal className="w-[18px] h-[18px]" />
                    Explore Live Simulator
                  </a>
                </div>

                {/* Micro Features Bar */}
                <div className="pt-6 border-t border-slate-200/50 dark:border-dark-border/40 w-full grid grid-cols-3 gap-4 text-slate-400 dark:text-dark-mute">
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">100% Secure</p>
                    <p className="text-[10px] mt-1">Encryption First</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">OCR Parsing</p>
                    <p className="text-[10px] mt-1">AI Digitize</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">Open Source</p>
                    <p className="text-[10px] mt-1">Self-Hostable</p>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-6 animate-fade-in-up delay-200">
                <div className="relative w-full">
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/20 to-violet-500/15 blur-2xl opacity-60"></div>
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
                    <img 
                      src="/images/spendly_hero_dashboard.png"
                      alt="Spendly expense tracking dashboard"
                      className="w-full h-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Bento Grid Features Section */}
          <section className="py-16 md:py-24 bg-surface-soft dark:bg-dark-elevated transition-colors border-t border-slate-200/50 dark:border-dark-border/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-primary dark:text-primary-light text-[9px] font-mono font-bold uppercase tracking-widest">
                  Full Stack Engine
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                  Engineered for visual clarity and ultimate privacy.
                </h2>
                <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">
                  Spendly combines cutting-edge OCR ingestion with a lightweight transactional database to give you an uncompromised tracking system.
                </p>
              </div>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {/* Feature 1 */}
                <div className="card-apple p-6 md:p-8 flex flex-col justify-between hover-lift md:col-span-2">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary dark:text-primary-light flex items-center justify-center mb-6">
                      <Cpu className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">OCR Ingestion Receipt Digitation</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-xl">
                      Stop manually recording entries. Snap or upload a photo of any bill or receipt, and let Spendly's local OCR scanner automatically extract the merchant name, transactional items, tax configurations, and total billing amounts in real time.
                    </p>
                  </div>
                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-100 dark:border-dark-border/40 flex items-center gap-3">
                    <span className="tag-badge tag-health">AI-assisted</span>
                    <span className="tag-badge tag-other">Zero API leaks</span>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="card-apple p-6 md:p-8 flex flex-col justify-between hover-lift">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-6">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Obsidian Dark Mode</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">
                      A beautiful, low-contrast dark mode designed to ease your eyes. Seamless transitions match your system preferences or active console triggers.
                    </p>
                  </div>
                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-100 dark:border-dark-border/40">
                    <span className="tag-badge tag-transport">Fluid theme sync</span>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="card-apple p-6 md:p-8 flex flex-col justify-between hover-lift">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-6">
                      <Brain className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Burn Forecasts</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">
                      Project your total monthly burn based on real-time averages. Get early notifications when forecast trajectories exceed active budgets.
                    </p>
                  </div>
                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-100 dark:border-dark-border/40">
                    <span className="tag-badge tag-food">Daily projections</span>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="card-apple p-6 md:p-8 flex flex-col justify-between hover-lift md:col-span-2">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-6">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">Subscription & Recurring Manager</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-xl">
                      Keep track of monthly, quarterly, and annual SaaS recurring bills. Spendly automatically projects renewals into your active ledger timeline and reminds you when recurring payment channels are about to execute.
                    </p>
                  </div>
                  <div className="mt-6 md:mt-8 pt-4 md:pt-6 border-t border-slate-100 dark:border-dark-border/40 flex items-center gap-3">
                    <span className="tag-badge tag-bills">Auto renewals</span>
                    <span className="tag-badge tag-shopping">Sub analytics</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Live Demo */}
          <section id="live-demo" className="py-24 bg-canvas dark:bg-dark-bg transition-colors relative overflow-hidden">
            <div className="glow-blob top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-primary text-[9px] font-mono font-bold uppercase tracking-widest">
                  Simulator Console
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                  Simulate a transaction stream in real time.
                </h2>
                <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">
                  Select category filters to see how the ledger terminal organizes and tracks your transactional burn rate dynamically.
                </p>
              </div>

              <LiveSimulator />
            </div>
          </section>

          {/* Testimonials */}
          <section className="py-24 bg-surface-soft dark:bg-dark-elevated transition-colors border-t border-slate-200/50 dark:border-dark-border/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-500 text-[9px] font-mono font-bold uppercase tracking-widest">
                  Community Feedback
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                  Loved by thousands of conscious spenders.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Alex Johnson", role: "Freelancer", text: "The receipt scanner is incredibly fast. I used to spend hours manually entering my expenses at the end of the month, now it takes seconds." },
                  { name: "Maria Patel", role: "Small Business Owner", text: "Spendly's burn rate forecast actually stopped me from buying things I didn't need. The interactive charts make managing cashflow so much easier." },
                  { name: "Sam Lee", role: "Software Engineer", text: "Finally, a privacy-first tracker that isn't trying to sell my data to credit card companies. The minimalist dark mode is absolutely beautiful." }
                ].map((item, index) => (
                  <div key={index} className="card-apple p-6 flex flex-col gap-4">
                    <div className="flex gap-1 text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-[16px] h-[16px] fill-current" />)}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-dark-mute flex-grow">"{item.text}"</p>
                    <div className="flex items-center gap-3 mt-4">
                      <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold">
                        {item.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                        <p className="text-[10px] text-slate-400">{item.role}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="py-24 bg-canvas dark:bg-dark-bg transition-colors border-t border-slate-200/50 dark:border-dark-border/40">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-mono font-bold uppercase tracking-widest">
                  Transparent Pricing
                </div>
                <h2 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                  Get full financial metrics telemetry.
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-2xl mx-auto">
                <div className="card-apple p-8 flex flex-col justify-between hover-lift">
                  <div>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">Hobby Sandbox</p>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">₹0 <span className="text-sm font-normal text-slate-400">/ free</span></p>
                    <ul className="space-y-4 mb-8 flex-grow">
                      {["Up to 2 active accounts", "Up to 50 monthly manual entries", "Basic charts and aggregates", "No receipt scanning"].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-dark-mute">
                          <CheckCircle className="w-[18px] h-[18px] text-primary" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register" className="btn-secondary text-center py-3 text-sm font-bold w-full border border-slate-200 dark:border-white/10">Start Tracking</Link>
                </div>

                <div className="card-apple p-8 flex flex-col justify-between hover-lift border-2 border-primary/20 dark:border-primary/40 relative">
                  <div className="absolute top-0 right-6 -translate-y-1/2 bg-primary text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Popular</div>
                  <div>
                    <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-wider mb-2">Pro Ledger</p>
                    <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-6">₹199 <span className="text-sm font-normal text-slate-400">/ month</span></p>
                    <ul className="space-y-4 mb-8 flex-grow">
                      {["Unlimited manual entries", "Unlimited Receipt OCR scans", "Custom budget alerts & forecasting", "CSV Data Export"].map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-slate-600 dark:text-dark-mute">
                          <CheckCircle className="w-[18px] h-[18px] text-primary" /> {feat}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href="/register" className="btn-primary text-center py-3 text-sm font-bold w-full shadow-lg shadow-primary/20">Upgrade to Pro</Link>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="py-24 bg-surface-soft dark:bg-dark-elevated transition-colors border-t border-slate-200/50 dark:border-dark-border/40 relative overflow-hidden">
            <div className="glow-blob bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-primary/10 rounded-t-full" />
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
              <h2 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight">
                Take Control of Your Cash Flow today.
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute max-w-xl mx-auto leading-relaxed">
                Spendly gives you the diagnostic visual telemetry you need to stay on budget. Fully customizable, responsive, and completely secure.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register" className="btn-primary w-full sm:w-auto py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center gap-2 group justify-center">
                  <Rocket className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  Get Started Free
                </Link>
                <Link href="/login" className="btn-secondary w-full sm:w-auto py-3.5 text-sm font-bold">
                  Sign In
                </Link>
              </div>
              
              {/* Receipt scanner image below CTA */}
              <div className="mt-14 max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-900/10 dark:ring-white/10">
                <img 
                  src="/images/spendly_receipt_scanner.png"
                  alt="Spendly AI receipt scanner feature"
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  );
}
