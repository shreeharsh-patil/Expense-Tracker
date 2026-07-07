'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-surface-parchment dark:bg-dark-card/50 border-t border-slate-200 dark:border-dark-border/40 px-4 sm:px-6 lg:px-8 py-12 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1 flex flex-col items-start gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full"></span>
            <span className="font-sans font-bold text-lg text-slate-900 dark:text-white tracking-tight">Spendly</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 dark:text-dark-mute max-w-xs">
            Track expenses, set budgets, and take control of your finances.
          </p>
          <p className="text-[10px] text-slate-400 dark:text-dark-mute mt-1">
            &copy; {currentYear} Spendly. All rights reserved.
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-3 font-semibold">Product</p>
          <ul className="space-y-2 text-xs" style={{ lineHeight: 2.41 }}>
            <li><Link href="/features" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">Features</Link></li>
            <li><Link href="/pricing" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/receipt/scan" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">OCR Scanning</Link></li>
            <li><Link href="/export" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">Export</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-3 font-semibold">Company</p>
          <ul className="space-y-2 text-xs" style={{ lineHeight: 2.41 }}>
            <li><Link href="/about" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">About</Link></li>
            <li><Link href="/blog" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/careers" className="text-slate-500 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white transition-colors">Careers</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
