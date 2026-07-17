'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#eca8d6]/20 to-[#a78bfa]/20 border border-foreground/10 flex items-center justify-center p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/favicon.svg" alt="Spendly Logo" className="w-full h-full object-contain" />
          </div>

          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            About
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-8">
            About
            <br />
            <span className="text-muted-foreground">Spendly.</span>
          </h1>

          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-6">
            We built Spendly because we believe personal finance shouldn&apos;t be complicated. Our mission is to provide beautiful, intuitive tools that empower individuals to understand their spending habits and achieve financial peace of mind.
          </p>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Founded in 2026, Spendly is proudly built for the modern consumer.
          </p>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
