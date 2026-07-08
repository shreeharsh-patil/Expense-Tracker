'use client';

import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Briefcase } from 'lucide-react';

export default function CareersPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-24 relative overflow-hidden">
          <div className="glow-blob top-1/4 left-1/4 w-72 h-72 bg-primary/10"></div>

          <div className="max-w-2xl w-full relative z-10 text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-6">Join our team</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute mb-12 text-lg">Help us build the future of personal finance.</p>
            <div className="card-apple p-12 rounded-3xl text-center shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-slate-400" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-slate-900 dark:text-white">No open positions</h3>
              <p className="text-sm text-slate-500 dark:text-dark-mute leading-relaxed max-w-sm mx-auto">We&apos;re currently a small, focused team and aren&apos;t hiring at the moment. Check back later!</p>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  );
}
