'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';

const securityHighlights = [
  {
    title: 'Encryption at Rest & In Transit',
    description: 'All data is encrypted using AES-256 at rest and TLS 1.3 in transit. Your financial information and personal details are never stored in plaintext.',
  },
  {
    title: 'SOC 2 Compliance',
    description: 'We follow SOC 2 Type II standards for security, availability, and confidentiality. Our infrastructure is regularly audited by independent third parties.',
  },
  {
    title: 'Zero-Knowledge Architecture',
    description: 'Your data is encrypted with keys we cannot access. This means even in the unlikely event of a breach, your financial information remains unreadable.',
  },
  {
    title: 'GDPR & CCPA Compliant',
    description: 'We fully comply with GDPR and CCPA regulations. You have the right to access, export, or permanently delete all of your data at any time.',
  },
  {
    title: 'Real-Time Threat Monitoring',
    description: 'Our systems are monitored 24/7 for suspicious activity. Automated alerts and defensive measures are triggered instantly to protect your account.',
  },
  {
    title: 'Regular Penetration Testing',
    description: 'We engage third-party security firms to conduct regular penetration tests and vulnerability assessments, ensuring our defenses stay ahead of emerging threats.',
  },
];

export default function SecurityPage() {
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
            Trust & Safety
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-8">
            Your security,
            <br />
            <span className="text-muted-foreground">our priority.</span>
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mb-16">
            We take the protection of your financial data seriously. Every layer of Spendly is built with industry-standard security practices to ensure your information stays private and safe.
          </p>

          {/* Security Highlights Grid */}
          <div className="space-y-4 mb-20">
            {securityHighlights.map((item, i) => (
              <div
                key={item.title}
                className={`p-6 md:p-8 border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/30 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <h3 className="text-lg font-display text-foreground mb-3">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Security Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20">
            {[
              { value: 'AES-256', label: 'Encryption' },
              { value: '99.9%', label: 'Uptime' },
              { value: '24/7', label: 'Monitoring' },
              { value: '0', label: 'Data Breaches' },
            ].map((stat, i) => (
              <div
                key={i}
                className="p-5 border border-foreground/10 bg-foreground/[0.02] text-center"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <p className="text-2xl font-display tracking-tight">{stat.value}</p>
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Certificate & Compliance */}
          <div className="p-8 border border-foreground/10 bg-foreground/[0.02]">
            <h2 className="text-xl font-display text-foreground mb-6">Certifications & Compliance</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { name: 'SOC 2', description: 'Type II Certified' },
                { name: 'GDPR', description: 'Fully Compliant' },
                { name: 'CCPA', description: 'Fully Compliant' },
                { name: 'ISO 27001', description: 'Certified' },
              ].map((cert) => (
                <div key={cert.name} className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 border border-foreground/10 flex items-center justify-center">
                    <span className="text-xs font-mono text-foreground/60">{cert.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cert.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-12 pt-8 border-t border-foreground/10">
            <h2 className="text-xl font-display text-foreground mb-4">Report a Vulnerability</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              If you believe you&apos;ve found a security vulnerability in Spendly, please responsibly disclose it to us. We&apos;ll investigate and respond promptly.
            </p>
            <a
              href="mailto:security@spendly.app"
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors"
            >
              security@spendly.app
            </a>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
