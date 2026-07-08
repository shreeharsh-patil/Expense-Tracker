import React from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';


const posts = [
  {
    category: 'Product Update',
    title: 'Introducing AI Receipt Scanning',
    description: 'Learn how our new OCR technology saves you hours of manual data entry by extracting transaction details instantly.'
  },
  {
    category: 'Financial Guide',
    title: 'How to build a monthly budget that works',
    description: 'A step-by-step guide to taking control of your finances using the 50/30/20 rule and Spendly\'s tracking tools.'
  }
];

export default function BlogPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-24 relative overflow-hidden">
          <div className="glow-blob top-1/4 -right-20 w-72 h-72 bg-primary/10"></div>

          <div className="max-w-3xl w-full relative z-10 text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl lg:text-5xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-12">Spendly Blog</h1>
            <div className="space-y-6 text-left">
              {posts.map((post, index) => (
                <div key={index} className="card-apple p-8 sm:p-10 rounded-3xl hover:border-primary transition-colors cursor-pointer group">
                  <p className="text-[10px] text-primary font-bold mb-3 uppercase tracking-widest">{post.category}</p>
                  <h3 className="font-bold text-2xl mb-3 text-slate-900 dark:text-white group-hover:text-primary transition-colors">{post.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-dark-mute leading-relaxed">{post.description}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        <Footer />
      </div>
  );
}
