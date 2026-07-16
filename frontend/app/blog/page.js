'use client';

import { useState, useEffect } from 'react';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { ArrowRight } from 'lucide-react';

const posts = [
  {
    category: 'Product Update',
    title: 'Introducing AI Receipt Scanning',
    description: 'Learn how our new OCR technology saves you hours of manual data entry by extracting transaction details instantly.',
    date: 'July 2026',
  },
  {
    category: 'Financial Guide',
    title: 'How to build a monthly budget that works',
    description: 'A step-by-step guide to taking control of your finances using the 50/30/20 rule and Spendly\'s tracking tools.',
    date: 'June 2026',
  },
  {
    category: 'Tips',
    title: '5 ways to reduce monthly subscriptions',
    description: 'Uncover hidden recurring charges and learn how Spendly\'s subscription tracker can help you save hundreds each year.',
    date: 'May 2026',
  },
];

export default function BlogPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />

      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-8 h-px bg-foreground/30" />
            Blog
          </span>

          <h1 className="text-5xl md:text-6xl lg:text-[72px] font-display tracking-tight leading-[0.95] mb-4">
            Latest
            <br />
            <span className="text-muted-foreground">articles.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-16">
            Tips, guides, and updates from the Spendly team.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post, i) => (
              <div
                key={i}
                className={`p-8 border border-foreground/10 bg-foreground/[0.02] hover:border-foreground/30 transition-all duration-500 group ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-[10px] font-mono text-[#eca8d6] uppercase tracking-widest">{post.category}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{post.date}</span>
                </div>
                <h3 className="text-xl font-display mb-3 group-hover:text-[#eca8d6] transition-colors">{post.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{post.description}</p>
                <span className="inline-flex items-center gap-2 text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                  Read more <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
