'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../components/AuthContext';
import { Navigation } from "../components/landing/navigation";
import { HeroSection } from "../components/landing/hero-section";
import { FeaturesSection } from "../components/landing/features-section";
import { HowItWorksSection } from "../components/landing/how-it-works-section";
import { InfrastructureSection } from "../components/landing/infrastructure-section";
import { MetricsSection } from "../components/landing/metrics-section";
import { IntegrationsSection } from "../components/landing/integrations-section";
import { SecuritySection } from "../components/landing/security-section";
import { DevelopersSection } from "../components/landing/developers-section";
import { TestimonialsSection } from "../components/landing/testimonials-section";
import { PricingSection } from "../components/landing/pricing-section";
import { CtaSection } from "../components/landing/cta-section";
import { FooterSection } from "../components/landing/footer-section";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Don't flash landing content or wrong nav while checking auth
  if (loading) {
    return <main className="relative min-h-screen bg-background" />;
  }

  // Redirect logged-in users to dashboard
  if (user) {
    router.replace('/dashboard');
    return <main className="relative min-h-screen bg-background" />;
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <InfrastructureSection />
      <MetricsSection />
      <IntegrationsSection />
      <SecuritySection />
      <DevelopersSection />
      <TestimonialsSection />
      <PricingSection />
      <CtaSection />
      <FooterSection />
    </main>
  );
}
