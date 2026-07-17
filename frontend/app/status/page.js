'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { CheckCircle, Clock, Activity } from 'lucide-react';

const services = [
  { name: 'API', status: 'operational', uptime: '99.9%' },
  { name: 'OCR Scanner', status: 'operational', uptime: '99.8%' },
  { name: 'Database', status: 'operational', uptime: '99.99%' },
  { name: 'Authentication', status: 'operational', uptime: '100%' },
  { name: 'Web App', status: 'operational', uptime: '99.9%' },
  { name: 'Export Service', status: 'operational', uptime: '99.7%' },
];

const incidents = [
  { date: 'July 12, 2026', title: 'Scheduled maintenance', status: 'resolved', desc: 'Planned database upgrade completed successfully. No downtime.' },
  { date: 'June 28, 2026', title: 'OCR latency spike', status: 'resolved', desc: 'Temporary increase in scan processing time. Resolved within 15 minutes.' },
  { date: 'June 5, 2026', title: 'API rate limit issue', status: 'resolved', desc: 'Rate limiter configuration updated. All services normal.' },
];

export default function StatusPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          <h1 className="text-6xl md:text-7xl lg:text-[100px] font-display tracking-tight leading-[0.9] mb-8">
            System
            <br />
            <span className="text-muted-foreground">status.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-16">
            Real-time status of Spendly services and infrastructure.
          </p>

          {/* Service Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-20">
            {services.map((service, i) => (
              <div
                key={service.name}
                className={`p-6 border border-foreground/10 bg-foreground/[0.02] transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">{service.name}</span>
                  <span className={`flex items-center gap-1.5 text-xs font-mono ${
                    service.status === 'operational' ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      service.status === 'operational' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`} />
                    {service.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Activity className="w-3.5 h-3.5" />
                  <span className="font-mono">{service.uptime} uptime</span>
                </div>
              </div>
            ))}
          </div>

          {/* Incident History */}
          <h2 className="text-2xl font-display mb-6">Recent incidents</h2>
          <div className="space-y-3">
            {incidents.map((incident, i) => (
              <div
                key={i}
                className={`p-6 border border-foreground/10 transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 80 + 200}ms` }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium mb-1">{incident.title}</h3>
                    <p className="text-sm text-muted-foreground">{incident.desc}</p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 whitespace-nowrap">
                    <CheckCircle className="w-3 h-3" />
                    {incident.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-3">
                  <Clock className="w-3 h-3" />
                  {incident.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
