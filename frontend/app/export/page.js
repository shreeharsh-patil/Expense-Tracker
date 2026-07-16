'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Download, ArrowRight } from 'lucide-react';

export default function ExportPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />

      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`max-w-3xl mx-auto text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="w-16 h-16 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-[#eca8d6]/20 to-[#a78bfa]/20 border border-foreground/10 flex items-center justify-center">
            <Download className="w-8 h-8 text-foreground/60" />
          </div>

          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Data
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-8">
            Export your
            <br />
            <span className="text-muted-foreground">data.</span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto mb-12">
            Your data belongs to you. Easily export your entire transaction history to CSV format for use in Excel, Google Sheets, or your accountant&apos;s software.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm font-medium transition-all group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
