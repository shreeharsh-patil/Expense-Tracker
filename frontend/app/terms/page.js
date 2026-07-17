'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';

export default function TermsPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Legal
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-12">
            Terms of
            <br />
            <span className="text-muted-foreground">service.</span>
          </h1>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground"><strong>Last updated:</strong> July 2026</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using Spendly (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">2. Description of Service</h2>
            <p>Spendly is a personal expense tracking application that provides tools for recording, categorizing, and analyzing financial transactions. The Service includes OCR receipt scanning, budget forecasting, and data export features.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">3. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. You agree not to misuse the Service or attempt to access it through unauthorized means.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">4. Data Privacy</h2>
            <p>We take your privacy seriously. Your financial data is encrypted and never shared with third parties without your explicit consent. Please refer to our Privacy Policy for more details.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">5. Limitations of Liability</h2>
            <p>Spendly is provided &quot;as is&quot; without warranties of any kind. We are not responsible for any financial decisions made based on the data presented in the Service. Always consult a professional financial advisor for important decisions.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Users will be notified of material changes via email or through the Service.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">7. Contact</h2>
            <p>For questions about these terms, please contact us at <a href="mailto:support@spendly.app" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">support@spendly.app</a>.</p>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
