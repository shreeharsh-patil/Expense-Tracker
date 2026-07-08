'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Wallet, BarChart3, Scan, User, Image, PlusCircle, Plus, TrendingUp } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: Wallet },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/receipts/gallery', label: 'Receipts', icon: Image },
  { href: '/profile', label: 'Profile', icon: User },
];

const QUICK_ACTIONS = [
  { href: '/expenses/add', label: 'Expense', icon: Plus, color: 'primary' },
  { href: '/income/add', label: 'Income', icon: TrendingUp, color: 'signature-mint' },
  { href: '/receipt/scan', label: 'Scan', icon: Scan, color: 'signature-coral' },
];

export default function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close sheet on Escape key
  useEffect(() => {
    if (!sheetOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [sheetOpen]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (sheetOpen) {
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [sheetOpen]);

  const isActive = (href) => pathname === href;

  // Don't render for unauthenticated users
  if (!user) return null;

  return (
    <>
      <nav
        id="mobile-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 bottom-nav-safe pt-2 bg-white/95 dark:bg-dark-card/95 backdrop-blur-xl border-t border-slate-200 dark:border-dark-border transition-colors shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.3)]"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Left navigation items */}
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const active = isActive(item.href);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 relative ${
                active
                  ? 'text-primary mobile-nav-active'
                  : 'text-slate-500 dark:text-dark-mute hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <IconComponent className="w-[22px] h-[22px]" />
              <span className="font-sans text-[9px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* Plus button to open quick-add sheet */}
        <button
          className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-primary-light text-white shadow-lg shadow-primary/30 active:scale-95 transition-all duration-200 focus:outline-none -translate-y-2.5 border-4 border-canvas dark:border-dark-bg ${
            sheetOpen ? 'rotate-45' : ''
          }`}
          onClick={() => setSheetOpen(!sheetOpen)}
          aria-label="Quick add"
          aria-expanded={sheetOpen}
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Right navigation items */}
        {NAV_ITEMS.slice(2, 4).map((item) => {
          const active = isActive(item.href);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-nav-item flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-all duration-200 relative ${
                active
                  ? 'text-primary mobile-nav-active'
                  : 'text-slate-500 dark:text-dark-mute hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <IconComponent className="w-[22px] h-[22px]" />
              <span className="font-sans text-[9px] font-semibold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile quick-add bottom sheet */}
      <div
        className={`md:hidden mobile-overlay ${sheetOpen ? 'open' : ''}`}
        onClick={() => setSheetOpen(false)}
        role="presentation"
      />
      <div className={`md:hidden mobile-sheet ${sheetOpen ? 'open' : ''}`} role="dialog" aria-label="Quick actions" aria-modal={sheetOpen}>
        <div className="mobile-sheet-handle" />
        <p className="text-xs font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest text-center mb-6">Quick Actions</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          {QUICK_ACTIONS.map((action) => {
            const IconComponent = action.icon;
            const hoverColor = action.color === 'primary'
              ? 'hover:bg-primary/10 dark:hover:bg-primary/10'
              : action.color === 'signature-mint'
              ? 'hover:bg-signature-mint/10 dark:hover:bg-signature-mint/10'
              : 'hover:bg-signature-coral/10 dark:hover:bg-signature-coral/10';
            const iconBg = action.color === 'primary'
              ? 'bg-primary/10 text-primary'
              : action.color === 'signature-mint'
              ? 'bg-signature-mint/10 text-signature-mint'
              : 'bg-signature-coral/10 text-signature-coral';

            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setSheetOpen(false)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 ${hoverColor} transition-all active:scale-95`}
              >
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                  <IconComponent className="w-[24px] h-[24px]" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-dark-mute">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
