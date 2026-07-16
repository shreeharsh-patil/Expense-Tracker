'use client';

import { useEffect, useRef, useState } from 'react';

const steps = [
  {
    number: '01',
    title: 'Connect',
    subtitle: 'your accounts',
    description: 'Link your bank accounts, credit cards, or start fresh. Set up custom categories and budgets that match your lifestyle.',
    code: `const account = new Account({\n  type: 'checking',\n  name: 'Main Account',\n  balance: 12450.00\n})\n\nawait ledger.link(account)`,
  },
  {
    number: '02',
    title: 'Scan',
    subtitle: 'your receipts',
    description: 'Snap a photo of any receipt. Spendly\'s OCR engine automatically extracts merchant, items, tax, and total — no manual entry needed.',
    code: `const receipt = await scanner.analyze({\n  image: receiptPhoto,\n  extract: ['merchant', 'items', 'tax', 'total']\n})\n// Cafe Deluxe — $24.50`,
  },
  {
    number: '03',
    title: 'Track',
    subtitle: '& save more',
    description: 'Monitor your spending in real-time. Get burn rate forecasts, subscription alerts, and monthly reports — all in one dashboard.',
    code: `dashboard.metrics({\n  period: 'monthly',\n  categories: ['food', 'bills', 'shopping'],\n  alerts: true\n})\n// You saved $340 this month`,
  },
];

export function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="relative py-24 lg:py-32 text-white overflow-hidden"
      style={{ backgroundColor: 'oklch(0.09 0.01 260)' }}
    >
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-white/[0.02] blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="relative mb-0 lg:mb-0 grid lg:grid-cols-2 gap-4 lg:gap-12 items-end">
          <div className="overflow-hidden pb-0 lg:pb-32">
            <div className={`transition-all duration-1000 ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-12 opacity-0'}`}>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-white/40 mb-8">
                <span className="w-12 h-px bg-white/20" />
                Process
              </span>
            </div>
            
            <h2 className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.85] transition-all duration-1000 delay-100 ${
              isVisible ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
            }`}>
              <span className="block">Connect.</span>
              <span className="block text-white/30">Scan.</span>
              <span className="block text-white/10">Save.</span>
            </h2>
          </div>

          <div className={`relative h-[320px] lg:h-[640px] overflow-hidden transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}>
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tree-uAia6REvB137CQyHFCf0za3O6h2zKO.png"
              alt=""
              aria-hidden="true"
              className="absolute bottom-0 left-0 w-full h-full object-contain object-bottom"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.09_0.01_260)] via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Horizontal Steps Layout */}
        <div className="grid lg:grid-cols-3 gap-4">
          {steps.map((step, index) => (
            <button
              key={step.number}
              type="button"
              onClick={() => setActiveStep(index)}
              className={`relative text-left p-8 lg:p-12 border transition-all duration-500 ${
                activeStep === index 
                  ? 'bg-[#000000] border-white/60' 
                  : 'bg-[#000000] border-white/25 hover:border-white/50'
              }`}
            >
              <div className="flex items-center gap-4 mb-8">
                <span className={`text-4xl font-display transition-colors duration-300 ${
                  activeStep === index ? 'text-[#eca8d6]' : 'text-white/20'
                }`}>
                  {step.number}
                </span>
                <div className="flex-1 h-px bg-white/10 overflow-hidden">
                  {activeStep === index && (
                    <div className="h-full bg-[#eca8d6]/50 animate-progress" />
                  )}
                </div>
              </div>

              <h3 className="text-3xl lg:text-4xl font-display mb-2">
                {step.title}
              </h3>
              <span className="text-xl text-white/40 font-display block mb-6">
                {step.subtitle}
              </span>

              <p className={`text-white/60 leading-relaxed transition-opacity duration-300 ${
                activeStep === index ? 'opacity-100' : 'opacity-60'
              }`}>
                {step.description}
              </p>

              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-[#eca8d6] transition-transform duration-500 origin-left ${
                activeStep === index ? 'scale-x-100' : 'scale-x-0'
              }`} />
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 6s linear forwards;
        }
      `}</style>
    </section>
  );
}
