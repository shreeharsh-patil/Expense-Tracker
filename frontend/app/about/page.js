import React from 'react';
import Image from 'next/image';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function AboutPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-24 relative overflow-hidden">
          <div className="glow-blob top-1/4 -left-20 w-72 h-72 bg-primary/10"></div>
          <div className="glow-blob bottom-1/4 -right-20 w-72 h-72 bg-rose-500/10"></div>

          <div className="max-w-2xl w-full relative z-10 text-center animate-fade-in-up">
            <div className="w-24 h-24 mx-auto mb-8 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-slate-900/10 dark:ring-white/10 bg-white p-2">
              <Image src="/images/favicon.png" alt="Spendly Logo" width={96} height={96} className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-6">About Spendly</h1>
            <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute mb-6 text-lg leading-relaxed">
              We built Spendly because we believe personal finance shouldn&apos;t be complicated. Our mission is to provide beautiful, intuitive tools that empower individuals to understand their spending habits and achieve financial peace of mind.
            </p>
            <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">
              Founded in 2026, Spendly is proudly built for the modern consumer.
            </p>
          </div>
        </main>

        <Footer />
      </div>
  );
}
