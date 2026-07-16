'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Mail, MessageSquare, HelpCircle, ArrowRight } from 'lucide-react';

const contactMethods = [
  {
    icon: Mail,
    title: 'Email us',
    description: 'For support and general inquiries',
    action: 'support@spendly.app',
    href: 'mailto:support@spendly.app',
  },
  {
    icon: MessageSquare,
    title: 'Live chat',
    description: 'Chat with our team in real-time',
    action: 'Start a conversation',
    href: '#',
  },
  {
    icon: HelpCircle,
    title: 'FAQ',
    description: 'Find answers to common questions',
    action: 'View FAQ',
    href: '/features',
  },
];

export default function ContactPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />

      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Get in touch
          </span>
          
          <h1 className="text-6xl md:text-7xl lg:text-[100px] font-display tracking-tight leading-[0.9] mb-8">
            Contact
            <br />
            <span className="text-muted-foreground">us.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-16">
            Have a question, feedback, or need help? We&apos;d love to hear from you.
          </p>

          {/* Contact Methods */}
          <div className="grid md:grid-cols-3 gap-6 mb-20">
            {contactMethods.map((method, i) => (
              <a
                key={method.title}
                href={method.href}
                className={`p-8 border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/30 transition-all duration-700 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <method.icon className="w-8 h-8 text-muted-foreground mb-6 group-hover:text-foreground transition-colors" />
                <h3 className="text-xl font-display mb-2">{method.title}</h3>
                <p className="text-sm text-muted-foreground mb-6">{method.description}</p>
                <span className="inline-flex items-center gap-2 text-sm font-medium group-hover:gap-3 transition-all">
                  {method.action}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </a>
            ))}
          </div>

          {/* Privacy-focused note */}
          <div className={`p-8 border border-foreground/10 bg-foreground/[0.02] transition-all duration-1000 delay-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="text-foreground font-medium">Privacy commitment:</span> Any information you share with our support team is encrypted and used only to resolve your inquiry. We never share your contact details with third parties.
            </p>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
