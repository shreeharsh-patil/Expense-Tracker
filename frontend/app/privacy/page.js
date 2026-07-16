'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';

export default function PrivacyPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />

      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Legal
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-12">
            Privacy
            <br />
            <span className="text-muted-foreground">policy.</span>
          </h1>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground"><strong>Last updated:</strong> July 2026</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">1. Information We Collect</h2>
            <p>We collect information you provide when creating an account (name, email address) and using the Service (financial transactions, receipt images, budget settings).</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">2. How We Use Your Information</h2>
            <p>Your data is used solely to provide and improve the Service. This includes processing transactions, generating reports, and providing OCR scanning functionality. We do not sell your personal information.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">3. Data Security</h2>
            <p>We implement industry-standard encryption and security measures to protect your data. All data is transmitted over HTTPS and stored with encryption at rest.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">4. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and associated data at any time by contacting support.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">5. Third-Party Services</h2>
            <p>We do not share your data with third parties except as necessary to provide the Service (e.g., hosting providers) or as required by law.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. You may also export your data at any time using the export feature.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">7. Contact</h2>
            <p>For privacy-related inquiries, please contact us at <a href="mailto:privacy@spendly.app" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">privacy@spendly.app</a>.</p>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
