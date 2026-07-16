'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    quote: 'The receipt scanner is incredibly fast. I used to spend hours manually entering my expenses at the end of the month, now it takes seconds.',
    author: 'Alex Johnson',
    role: 'Freelancer',
    company: 'Creative Studio',
    metric: { value: '10x', label: 'Faster entry' },
  },
  {
    quote: 'Spendly\'s burn rate forecast actually stopped me from buying things I didn\'t need. The interactive charts make managing cashflow so much easier.',
    author: 'Maria Patel',
    role: 'Small Business Owner',
    company: 'Patel & Co.',
    metric: { value: '40%', label: 'Reduced overspend' },
  },
  {
    quote: 'Finally, a privacy-first tracker that isn\'t trying to sell my data to credit card companies. The minimalist dark mode is absolutely beautiful.',
    author: 'Sam Lee',
    role: 'Software Engineer',
    company: 'TechCorp',
    metric: { value: '100%', label: 'Privacy guaranteed' },
  },
  {
    quote: 'I\'ve tried every expense tracker out there. Spendly is the only one that combines OCR, budgeting, and clean design without a monthly subscription fee.',
    author: 'Priya Sharma',
    role: 'Product Manager',
    company: 'Growth Labs',
    metric: { value: '₹0', label: 'Startup cost' },
  },
];

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
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
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (index) => {
    setActiveIndex(index);
  };

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const activeTestimonial = testimonials[activeIndex];

  // Deterministic "random" pattern to avoid hydration mismatch
  const asciiPattern = useMemo(() => {
    // Simple seeded pseudo-random
    let seed = 42;
    const next = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return seed / 2147483647;
    };
    return Array.from({ length: 60 }, () => 
      Array.from({ length: 100 }, () => 
        next() > 0.7 ? '$' : ' '
      ).join('')
    ).join('\n');
  }, []);

  return (
    <section id="testimonials" ref={sectionRef} className="relative py-32 lg:py-40 bg-foreground text-background overflow-hidden">
      <div className="absolute inset-0 font-mono text-[10px] text-background/[0.02] leading-tight overflow-hidden whitespace-pre select-none">
        {asciiPattern}
      </div>

      <div className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-20">
          <div>
            <span className="inline-flex items-center gap-3 text-sm font-mono text-background/40 mb-4">
              <span className="w-12 h-px bg-background/20" />
              Testimonials
            </span>
            <h2 className={`text-4xl lg:text-5xl font-display transition-all duration-1000 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              Loved by
              <span className="text-background/40"> conscious spenders.</span>
            </h2>
          </div>
          
          {/* Navigation arrows */}
          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={goPrev}
              className="p-4 border border-background/20 hover:bg-background/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goNext}
              className="p-4 border border-background/20 hover:bg-background/10 transition-colors"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
          <div className="lg:col-span-7 relative">
            <span className="absolute -left-4 -top-8 text-[200px] font-display text-background/5 leading-none select-none">
              &ldquo;
            </span>
            
            <div className="relative">
              <blockquote 
                key={activeIndex}
                className="text-3xl lg:text-4xl xl:text-5xl font-display leading-[1.2] tracking-tight animate-fadeSlideIn"
              >
                {activeTestimonial.quote}
              </blockquote>

              <div className="mt-12 flex items-center gap-6">
                <div className="w-14 h-14 rounded-full bg-background/10 flex items-center justify-center">
                  <span className="font-display text-xl">
                    {activeTestimonial.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-medium">{activeTestimonial.author}</p>
                  <p className="text-background/60">
                    {activeTestimonial.role}, {activeTestimonial.company}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-center gap-6">
            <div 
              key={`metric-${activeIndex}`}
              className="p-10 border border-background/20 bg-background/5 animate-fadeSlideIn"
            >
              <span className="text-7xl lg:text-8xl font-display block mb-4">
                {activeTestimonial.metric.value}
              </span>
              <span className="text-lg text-background/60">
                {activeTestimonial.metric.label}
              </span>
            </div>

            <div className="flex gap-2">
              {testimonials.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className="flex-1 h-1 bg-background/20 overflow-hidden"
                >
                  <div 
                    className={`h-full bg-background transition-all duration-300 ${
                      idx === activeIndex ? 'w-full' : idx < activeIndex ? 'w-full opacity-50' : 'w-0'
                    }`}
                    style={idx === activeIndex ? { animation: 'progress 8s linear forwards' } : {}}
                  />
                </button>
              ))}
            </div>

            <div className="mt-4 pt-6 border-t border-background/10">
              <span className="text-xs font-mono text-background/30 uppercase tracking-widest block mb-4">
                Featured users
              </span>
              <div className="flex flex-wrap gap-3">
                {testimonials.map((t, idx) => (
                  <button
                    key={t.company}
                    onClick={() => goTo(idx)}
                    className={`px-4 py-2 text-sm border transition-all ${
                      idx === activeIndex 
                        ? 'border-background/40 text-background' 
                        : 'border-background/10 text-background/40 hover:border-background/30'
                    }`}
                  >
                    {t.company}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeSlideIn {
          animation: fadeSlideIn 0.5s ease-out forwards;
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
