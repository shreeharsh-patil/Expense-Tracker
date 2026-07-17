'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Briefcase } from 'lucide-react';

export default function CareersPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Join us
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-6">
            Join our
            <br />
            <span className="text-muted-foreground">team.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-12 max-w-xl mx-auto">
            Help us build the future of personal finance.
          </p>

          <div className="p-10 border border-foreground/10 bg-foreground/[0.02] max-w-md mx-auto">
            <div className="w-14 h-14 mx-auto border border-foreground/20 flex items-center justify-center mb-6">
              <Briefcase className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display text-foreground mb-3">No open positions</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We&apos;re currently a small, focused team and aren&apos;t hiring at the moment. Check back later!
            </p>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
