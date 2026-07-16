'use client';

import { useEffect, useState, useRef } from 'react';

const categories = [
  { name: 'Food & Dining', icon: '🍽️', count: '43 transactions' },
  { name: 'Transportation', icon: '🚗', count: '18 transactions' },
  { name: 'Shopping', icon: '🛍️', count: '27 transactions' },
  { name: 'Bills & Utilities', icon: '📄', count: '12 transactions' },
  { name: 'Entertainment', icon: '🎬', count: '15 transactions' },
  { name: 'Healthcare', icon: '🏥', count: '8 transactions' },
  { name: 'Education', icon: '📚', count: '5 transactions' },
  { name: 'Travel', icon: '✈️', count: '3 transactions' },
  { name: 'Groceries', icon: '🛒', count: '31 transactions' },
  { name: 'Subscriptions', icon: '🔄', count: '9 transactions' },
  { name: 'Income', icon: '💰', count: '4 transactions' },
  { name: 'Transfers', icon: '↔️', count: '11 transactions' },
];

export function IntegrationsSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [mousePos, setMousePos] = useState(null);
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

  return (
    <section id="integrations" ref={sectionRef} className="relative overflow-hidden">
      {/* Header */}
      <div className="relative z-10 pt-32 lg:pt-40 text-center">
        <span className={`inline-flex items-center gap-4 text-sm font-mono text-muted-foreground mb-8 transition-all duration-700 justify-center ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <span className="w-12 h-px bg-foreground/20" />
          Categories
          <span className="w-12 h-px bg-foreground/20" />
        </span>

        <h2 className={`text-6xl md:text-7xl lg:text-[128px] font-display tracking-tight leading-[0.9] transition-all duration-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          Organize
          <br />
          <span className="text-muted-foreground">everything.</span>
        </h2>

        <p className={`mt-8 text-xl text-muted-foreground leading-relaxed max-w-lg mx-auto transition-all duration-1000 delay-100 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          Automatically categorize every transaction. Spendly uses smart rules to sort your spending into clear, customizable categories.
        </p>
      </div>

      {/* Category grid */}
      <div className="relative z-10 mt-16 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          {categories.map((cat, index) => (
            <div
              key={cat.name}
              className={`group relative overflow-hidden p-6 lg:p-8 border transition-all duration-500 cursor-default ${
                hoveredIndex === index
                  ? 'border-foreground bg-foreground/[0.04] scale-[1.02]'
                  : 'border-foreground/10 hover:border-foreground/30'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                transitionDelay: `${index * 30 + 300}ms`,
              }}
              onMouseEnter={(e) => {
                setHoveredIndex(index);
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
              }}
              onMouseLeave={() => {
                setHoveredIndex(null);
                setMousePos(null);
              }}
            >
              {hoveredIndex === index && mousePos && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-0"
                  style={{
                    background: `radial-gradient(200px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.1) 0%, transparent 70%)`,
                  }}
                />
              )}
              <span className={`absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 transition-colors ${
                hoveredIndex === index
                  ? 'bg-foreground text-background'
                  : 'bg-foreground/10 text-muted-foreground'
              }`}>
                {cat.count}
              </span>

              <div className="text-3xl mb-6">
                {cat.icon}
              </div>

              <span className="font-medium block">{cat.name}</span>

              <div className="absolute bottom-0 left-0 right-0 h-px bg-foreground/20 overflow-hidden">
                <div className={`h-full bg-foreground transition-all duration-500 ${
                  hoveredIndex === index ? 'w-full' : 'w-0'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom stats row */}
        <div className={`flex flex-wrap items-center justify-between gap-8 pt-12 border-t border-foreground/10 transition-all duration-1000 delay-500 pb-32 lg:pb-40 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="flex flex-wrap gap-12">
            {[
              { value: '20+', label: 'Categories' },
              { value: 'Smart', label: 'Auto-tagging' },
              { value: 'Custom', label: 'Create your own' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-baseline gap-3">
                <span className="text-3xl font-display">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>

          <a href="/categories" className="group inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors">
            Manage categories
            <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
