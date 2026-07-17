'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';

export default function CookiesPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className={`max-w-3xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Legal
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-12">
            Cookie
            <br />
            <span className="text-muted-foreground">policy.</span>
          </h1>

          <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
            <p className="text-foreground"><strong>Last updated:</strong> July 2026</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device by your web browser. They help us remember your preferences, understand how you use our Service, and improve your overall experience.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">2. How We Use Cookies</h2>
            <p>We use cookies for essential functionality (authentication, session management), analytics (understanding feature usage), and preference storage (theme selection, language settings). We do not use cookies for advertising or tracking across third-party sites.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">3. Types of Cookies We Use</h2>
            <p><strong>Essential Cookies:</strong> Required for the Service to function. These include session tokens and CSRF protection cookies. They are set automatically and cannot be disabled.</p>
            <p><strong>Functional Cookies:</strong> Remember your preferences such as dark mode selection, sidebar state, and currency settings. These enhance your experience but are not strictly necessary.</p>
            <p><strong>Analytics Cookies:</strong> Help us understand which features are most useful so we can improve the Service. We use privacy-respecting analytics that do not track you across different websites.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">4. Third-Party Cookies</h2>
            <p>We do not use third-party advertising cookies. Our analytics provider processes data in a privacy-preserving manner without sharing your information with other services. No personal financial data is ever included in analytics events.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">5. Managing Cookies</h2>
            <p>You can control cookies through your browser settings. Most browsers allow you to block or delete cookies. However, disabling essential cookies may impact the functionality of the Service, particularly authentication and session management.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">6. Cookie Duration</h2>
            <p>Session cookies expire when you close your browser. Persistent cookies remain on your device for up to 12 months unless you manually clear them. You can delete all stored cookies at any time through your browser settings.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">7. Changes to This Policy</h2>
            <p>We may update this Cookie Policy from time to time. Changes will be posted on this page, and where appropriate, notified to you via email or through the Service.</p>

            <h2 className="text-xl font-display text-foreground mt-12 mb-4">8. Contact</h2>
            <p>If you have any questions about our use of cookies, please contact us at <a href="mailto:privacy@spendly.app" className="text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors">privacy@spendly.app</a>.</p>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
