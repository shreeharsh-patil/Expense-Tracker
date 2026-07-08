import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm animate-fade-in-up">
        {/* 404 number with gradient */}
        <div className="text-[120px] leading-none font-extrabold tracking-tighter bg-gradient-to-b from-slate-200 to-slate-100 dark:from-white/10 dark:to-white/5 bg-clip-text text-transparent mb-2 select-none">
          404
        </div>

        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-5 -mt-6">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
          Page not found
        </h1>
        <p className="text-sm text-slate-500 dark:text-dark-mute mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Check the URL or head back to a familiar place.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary to-primary-light hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-primary/20 no-underline"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 no-underline"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
