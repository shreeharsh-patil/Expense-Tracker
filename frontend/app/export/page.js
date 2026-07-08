'use client';

import React from 'react';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Download, ArrowRight } from 'lucide-react';

export default function ExportPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-24 relative overflow-hidden">
          <div className="glow-blob top-1/4 -right-20 w-72 h-72 bg-rose-500/10"></div>

          <div className="max-w-2xl w-full relative z-10 text-center animate-fade-in-up">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center mb-8 shadow-lg shadow-primary/20 -rotate-3">
              <Download className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-6">Export Your Data</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute mb-10 text-lg leading-relaxed">
              Your data belongs to you. Easily export your entire transaction history to CSV format for use in Excel, Google Sheets, or your accountant&apos;s software.
            </p>
            <Link href="/register" className="btn-primary inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold shadow-xl shadow-primary/20 group">
              Start tracking
              <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </main>

        <Footer />
      </div>
  );
}
