'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { BookOpen, Code, Terminal, ExternalLink } from 'lucide-react';

const endpoints = [
  { method: 'GET', path: '/api/v1/transactions', desc: 'List all transactions' },
  { method: 'POST', path: '/api/v1/transactions', desc: 'Create a transaction' },
  { method: 'GET', path: '/api/v1/transactions/:id', desc: 'Get transaction details' },
  { method: 'PUT', path: '/api/v1/transactions/:id', desc: 'Update a transaction' },
  { method: 'DELETE', path: '/api/v1/transactions/:id', desc: 'Delete a transaction' },
  { method: 'GET', path: '/api/v1/accounts', desc: 'List all accounts' },
  { method: 'POST', path: '/api/v1/receipts/scan', desc: 'Scan a receipt via OCR' },
  { method: 'GET', path: '/api/v1/reports/monthly', desc: 'Get monthly report' },
  { method: 'GET', path: '/api/v1/categories', desc: 'List categories' },
  { method: 'POST', path: '/api/v1/budgets', desc: 'Set budget limits' },
];

const methodColors = {
  GET: 'text-emerald-400',
  POST: 'text-blue-400',
  PUT: 'text-amber-400',
  DELETE: 'text-rose-400',
};

export default function ApiDocsPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Developers
          </span>
          <h1 className="text-6xl md:text-7xl lg:text-[100px] font-display tracking-tight leading-[0.9] mb-8">
            API
            <br />
            <span className="text-muted-foreground">documentation.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-16">
            Integrate Spendly into your workflow. Our REST API gives you full access to transactions, accounts, receipts, and reports.
          </p>

          {/* Base URL */}
          <div className="p-6 border border-foreground/10 bg-foreground/[0.02] mb-12">
            <div className="flex items-center gap-3 mb-2">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-mono text-muted-foreground">Base URL</span>
            </div>
            <code className="text-sm font-mono text-foreground">https://api.spendly.app/v1</code>
          </div>

          {/* Authentication */}
          <div className="mb-12">
            <h2 className="text-2xl font-display mb-4">Authentication</h2>
            <div className="p-6 border border-foreground/10 bg-foreground/[0.02]">
              <p className="text-sm text-muted-foreground mb-4">All API requests require a Bearer token in the Authorization header:</p>
              <pre className="text-sm font-mono text-foreground bg-black/50 p-4 overflow-x-auto">
                <code>{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.spendly.app/v1/transactions`}</code>
              </pre>
            </div>
          </div>

          {/* Endpoints */}
          <h2 className="text-2xl font-display mb-6">Endpoints</h2>
          <div className="space-y-3">
            {endpoints.map((ep, i) => (
              <div
                key={i}
                className={`p-4 border border-foreground/10 hover:border-foreground/30 transition-all duration-300 flex items-center gap-4 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 30 + 200}ms` }}
              >
                <span className={`text-xs font-mono font-bold ${methodColors[ep.method]} shrink-0 w-16`}>
                  {ep.method}
                </span>
                <code className="text-sm font-mono text-foreground flex-1">{ep.path}</code>
                <span className="text-sm text-muted-foreground hidden md:block">{ep.desc}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
