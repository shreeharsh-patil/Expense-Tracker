'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../AuthContext';
import { Button } from '@/components/ui/button';
import { Menu, X, LogOut, User } from 'lucide-react';

const navLinks = [
  { name: 'Features',     href: '#features'      },
  { name: 'How it works', href: '#how-it-works'  },
  { name: 'Testimonials', href: '#testimonials'  },
  { name: 'Pricing',      href: '#pricing'       },
];

export function Navigation() {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed z-50 transition-all duration-500 ${
        isScrolled 
          ? 'top-4 left-4 right-4' 
          : 'top-0 left-0 right-0'
      }`}
    >
      <nav 
        className={`mx-auto transition-all duration-500 ${
          isScrolled || isMobileMenuOpen
            ? 'bg-background/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg max-w-[1200px]'
            : 'bg-transparent max-w-[1400px]'
        }`}
      >
        <div 
          className={`flex items-center justify-between transition-all duration-500 px-6 lg:px-8 ${
            isScrolled ? 'h-14' : 'h-20'
          }`}
        >
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 group">
            <span className="w-2 h-2 bg-gradient-to-tr from-[#eca8d6] to-[#a78bfa] rounded-full shadow-[0_0_10px_rgba(236,168,214,0.4)] transition-transform duration-300 group-hover:scale-125"></span>
            <span className={`font-display tracking-tight transition-all duration-500 ${isScrolled ? 'text-xl text-foreground' : 'text-2xl text-white'}`}>Spendly</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-12">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`text-sm transition-colors duration-300 relative group ${isScrolled ? 'text-foreground/70 hover:text-foreground' : 'text-white/70 hover:text-white'}`}
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full ${isScrolled ? 'bg-foreground' : 'bg-white'}`} />
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link href="/dashboard" className={`transition-all duration-500 ${isScrolled ? 'text-xs text-foreground/70 hover:text-foreground' : 'text-sm text-white/70 hover:text-white'}`}>
                  Dashboard
                </Link>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full border border-foreground/20 flex items-center justify-center text-[10px] font-medium bg-foreground/5">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : <User className="w-3.5 h-3.5" />}
                  </div>
                  <button
                    onClick={logout}
                    className={`transition-all duration-500 cursor-pointer ${isScrolled ? 'text-foreground/50 hover:text-foreground' : 'text-white/50 hover:text-white'}`}
                    title="Sign out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <a href="/login" className={`transition-all duration-500 ${isScrolled ? 'text-xs text-foreground/70 hover:text-foreground' : 'text-sm text-white/70 hover:text-white'}`}>
                  Sign in
                </a>
                <Button
                  size="sm"
                  className={`rounded-full transition-all duration-500 ${isScrolled ? 'bg-foreground hover:bg-foreground/90 text-background px-4 h-8 text-xs' : 'bg-white hover:bg-white/90 text-black px-6'}`}
                  asChild
                >
                  <a href="/register">Get started free</a>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors duration-500 ${isScrolled || isMobileMenuOpen ? 'text-foreground' : 'text-white'}`}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

      </nav>
      
      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-background z-40 transition-all duration-500 ${
          isMobileMenuOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        }`}
        style={{ top: 0 }}
      >
        <div className="flex flex-col h-full px-8 pt-28 pb-8">
          <div className="flex-1 flex flex-col justify-center gap-8">
            {navLinks.map((link, i) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-5xl font-display text-foreground hover:text-muted-foreground transition-all duration-500 ${
                  isMobileMenuOpen 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: isMobileMenuOpen ? `${i * 75}ms` : '0ms' }}
              >
                {link.name}
              </a>
            ))}
          </div>
          
          <div className={`flex gap-4 pt-8 border-t border-foreground/10 transition-all duration-500 ${
            isMobileMenuOpen
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: isMobileMenuOpen ? '300ms' : '0ms' }}
          >
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="flex-1 rounded-full h-14 text-base border border-foreground/20 flex items-center justify-center text-sm font-medium hover:bg-foreground/5 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { setIsMobileMenuOpen(false); logout(); }}
                  className="flex-1 bg-red-500/10 text-red-500 rounded-full h-14 text-base flex items-center justify-center gap-2 font-medium hover:bg-red-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="flex-1 rounded-full h-14 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                  asChild
                >
                  <a href="/login">Sign in</a>
                </Button>
                <Button
                  className="flex-1 bg-foreground text-background rounded-full h-14 text-base"
                  onClick={() => setIsMobileMenuOpen(false)}
                  asChild
                >
                  <a href="/register">Get started</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
