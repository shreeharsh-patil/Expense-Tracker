'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthContext';
import { Sun, Moon, Menu, X, Wallet, FileText, Camera, BarChart2, Repeat, User, Award, Tag, LogOut, ChevronRight } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });
  const [menuOpen, setMenuOpen] = useState(false);

  // Initialize theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const navLinkClass = (path) => {
    const active = pathname === path;
    return `px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
      active 
        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light' 
        : 'text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
    }`;
  };

  const mobileNavLinkClass = (path) => {
    const active = pathname === path;
    return `px-3 py-3 text-sm font-semibold rounded-xl transition-colors flex items-center gap-3 ${
      active 
        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light' 
        : 'text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
    }`;
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white/70 dark:bg-dark-bg/75 backdrop-blur-md border-b border-slate-200/50 dark:border-dark-border/40 transition-all h-16 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between h-full">
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <span className="w-3 h-3 bg-gradient-to-tr from-primary to-primary-light rounded-full shadow-[0_0_10px_rgba(79,70,229,0.4)] dark:shadow-[0_0_15px_rgba(165,180,252,0.4)] transition-transform duration-300 group-hover:scale-125"></span>
            <span className="font-sans font-bold text-lg tracking-tight text-slate-900 dark:text-white hover:text-transparent hover:bg-gradient-to-r hover:from-primary hover:to-primary-light transition-all duration-300">Spendly</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {user ? (
              <>
                <Link href="/dashboard" className={navLinkClass('/dashboard')}>Dashboard</Link>
                <Link href="/reports" className={navLinkClass('/reports')}>Reports</Link>
                <Link href="/receipt/scan" className={navLinkClass('/receipt/scan')}>Scan</Link>
                <Link href="/receipts/gallery" className={navLinkClass('/receipts/gallery')}>Receipts</Link>
                <Link href="/recurring" className={navLinkClass('/recurring')}>Recurring</Link>
                <Link href="/accounts" className={navLinkClass('/accounts')}>Accounts</Link>
                <Link href="/rules" className={navLinkClass('/rules')}>Rules</Link>
                <Link href="/tags" className={navLinkClass('/tags')}>Tags</Link>
                <Link href="/categories" className={navLinkClass('/categories')}>Categories</Link>
              </>
            ) : (
              <>
                <Link href="/features" className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Features</Link>
                <Link href="/pricing" className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">Pricing</Link>
                <Link href="/about" className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">About</Link>
              </>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors mr-1"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </button>

            {/* Desktop Action Buttons */}
            {user ? (
              <>
                <Link href="/profile" className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                  <User className="w-[16px] h-[16px] text-slate-400" />
                  {user.name}
                </Link>
                <button 
                  onClick={logout}
                  className="hidden md:inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary-light hover:brightness-110 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-[0_4px_12px_-4px_rgba(79,70,229,0.3)] cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hidden md:inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white transition-colors">Sign in</Link>
                <Link href="/register" className="hidden md:inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary to-primary-light hover:brightness-110 text-white text-xs font-semibold rounded-lg transition-all active:scale-95 shadow-[0_4px_12px_-4px_rgba(79,70,229,0.3)]">Get started</Link>
              </>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:!hidden touch-target w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-dark-mute flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-[22px] h-[22px]" /> : <Menu className="w-[22px] h-[22px]" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar/Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200/50 dark:border-dark-border/40 bg-white/95 dark:bg-dark-bg/95 backdrop-blur-xl transition-all duration-300 absolute top-16 left-0 w-full shadow-lg max-h-[80vh] overflow-y-auto z-40">
          <div className="flex flex-col px-4 py-3 space-y-1">
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/dashboard')}>
                  <Wallet className="w-[20px] h-[20px]" /> Dashboard
                </Link>
                <Link href="/reports" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/reports')}>
                  <BarChart2 className="w-[20px] h-[20px]" /> Reports
                </Link>
                <Link href="/receipt/scan" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/receipt/scan')}>
                  <Camera className="w-[20px] h-[20px]" /> Scan Receipt
                </Link>
                <Link href="/receipts/gallery" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/receipts/gallery')}>
                  <FileText className="w-[20px] h-[20px]" /> Receipt Gallery
                </Link>
                <Link href="/recurring" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/recurring')}>
                  <Repeat className="w-[20px] h-[20px]" /> Recurring
                </Link>
                <Link href="/accounts" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/accounts')}>
                  <Wallet className="w-[20px] h-[20px]" /> Accounts
                </Link>
                <Link href="/rules" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/rules')}>
                  <Award className="w-[20px] h-[20px]" /> Rules
                </Link>
                <Link href="/tags" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/tags')}>
                  <Tag className="w-[20px] h-[20px]" /> Tags
                </Link>
                <Link href="/categories" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/categories')}>
                  <Tag className="w-[20px] h-[20px]" /> Categories
                </Link>
                <hr className="border-slate-200/50 dark:border-dark-border/40 my-2" />
                <Link href="/profile" onClick={() => setMenuOpen(false)} className={mobileNavLinkClass('/profile')}>
                  <User className="w-[20px] h-[20px]" /> Profile ({user.name})
                </Link>
                <hr className="border-slate-200/50 dark:border-dark-border/40 my-2" />
                <button 
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="touch-target px-3 py-3 text-sm font-semibold bg-gradient-to-r from-primary to-primary-light text-white rounded-xl text-center shadow-md flex items-center justify-center gap-2 w-full cursor-pointer"
                >
                  <LogOut className="w-[20px] h-[20px]" /> Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/features" onClick={() => setMenuOpen(false)} className="touch-target px-3 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                  Features
                </Link>
                <Link href="/pricing" onClick={() => setMenuOpen(false)} className="touch-target px-3 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                  Pricing
                </Link>
                <Link href="/about" onClick={() => setMenuOpen(false)} className="touch-target px-3 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                  About
                </Link>
                <Link href="/login" onClick={() => setMenuOpen(false)} className="touch-target px-3 py-3 text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-dark-mute dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center gap-3">
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} className="touch-target px-3 py-3 text-sm font-semibold bg-gradient-to-r from-primary to-primary-light text-white rounded-xl text-center shadow-md flex items-center justify-center gap-2 mt-2">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
