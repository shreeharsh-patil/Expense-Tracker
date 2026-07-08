'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function ErrorBoundaryUI({ error, reset }) {
  const isAuthError = error?.message?.includes('401') || error?.response?.status === 401;
  const isNotFound = error?.message?.includes('404') || error?.response?.status === 404;

  let icon = AlertTriangle;
  let title = 'Something went wrong';
  let subtitle = 'An unexpected error occurred while loading this page.';
  let iconBg = 'bg-red-500/10 text-red-500';
  let gradient = 'from-red-500 to-rose-500';
  let shadowColor = 'shadow-red-500/20';

  if (isAuthError) {
    icon = Home;
    title = 'Authentication required';
    subtitle = 'Please sign in to access this page.';
    iconBg = 'bg-signature-coral/10 text-signature-coral';
    gradient = 'from-signature-coral to-rose-400';
    shadowColor = 'shadow-signature-coral/20';
  } else if (isNotFound) {
    icon = AlertTriangle;
    title = 'Data not found';
    subtitle = 'The requested data could not be found. It may have been deleted.';
    iconBg = 'bg-amber-500/10 text-amber-500';
    gradient = 'from-amber-500 to-orange-500';
    shadowColor = 'shadow-amber-500/20';
  }

  const IconComponent = icon;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 animate-fade-in-up">
      <div className="text-center max-w-sm">
        <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center mx-auto mb-5`}>
          <IconComponent className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-dark-mute mb-8 leading-relaxed">{subtitle}</p>

        {process.env.NODE_ENV !== 'production' && (
          <p className="text-[10px] font-mono text-slate-400 dark:text-dark-border mb-6 max-w-xs mx-auto truncate">
            {error?.message || 'Unknown error'}
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset?.()}
            className={`inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r ${gradient} hover:brightness-110 text-white text-xs font-bold rounded-xl transition-all active:scale-95 ${shadowColor} cursor-pointer`}
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border text-slate-600 dark:text-dark-mute hover:text-slate-900 dark:hover:text-white text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all active:scale-95 no-underline"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
