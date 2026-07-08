'use client';

import React, { useState, useEffect } from 'react';
import { Utensils, Receipt, Car } from 'lucide-react';

const demoTransactions = [
  { merchant: "Dinner at Kiara", category: "Food", amount: 1240.00, icon: Utensils, color: "orange" },
  { merchant: "AWS Cloud Ingestion", category: "Bills", amount: 2450.00, icon: Receipt, color: "indigo" },
  { merchant: "Uber Commute Taxi", category: "Transport", amount: 560.00, icon: Car, color: "blue" },
  { merchant: "Netflix subscription", category: "Bills", amount: 649.00, icon: Receipt, color: "indigo" },
  { merchant: "Blue Tokai Coffee", category: "Food", amount: 180.00, icon: Utensils, color: "orange" },
  { merchant: "Gas Station Refill", category: "Transport", amount: 1200.00, icon: Car, color: "blue" }
];

const categoryColorMap = {
  orange: 'bg-orange-500/10 text-orange-500',
  indigo: 'bg-indigo-500/10 text-indigo-500',
  blue: 'bg-blue-500/10 text-blue-500'
};

export default function LiveSimulator() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filteredList, setFilteredList] = useState(demoTransactions);
  const [burnTotal, setBurnTotal] = useState(0);
  const [burnPercent, setBurnPercent] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsFading(true);
    const timer = setTimeout(() => {
      const filtered = selectedCategory === 'All'
        ? demoTransactions
        : demoTransactions.filter(t => t.category === selectedCategory);

      const total = filtered.reduce((sum, item) => sum + item.amount, 0);
      const percent = Math.min(Math.round((total / 10000) * 100), 100);

      setFilteredList(filtered);
      setBurnTotal(total);
      setBurnPercent(percent);
      setIsFading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [selectedCategory]);

  const getProgressBarColor = () => {
    if (burnPercent > 70) return 'bg-rose-500';
    if (burnPercent > 45) return 'bg-amber-500';
    return 'bg-indigo-600 dark:bg-indigo-500';
  };

  return (
    <div className="max-w-2xl mx-auto card-apple p-6 sm:p-8 bg-white/90 dark:bg-dark-card/95 border border-slate-200/50 dark:border-white/5 shadow-2xl relative">
      {/* Terminal Header */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100 dark:border-dark-border/40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-red-400 rounded-full"></span>
          <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></span>
          <span className="w-2.5 h-2.5 bg-green-400 rounded-full"></span>
        </div>
        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">LIVE INTERACTIVE MOCK</span>
      </div>

      {/* Active stats display */}
      <div className="mb-8">
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-[9px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Current Burn</p>
            <p className="text-4xl font-mono font-bold text-slate-900 dark:text-white mt-1">
              ₹{burnTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Active Limit Progress</span>
            <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
              {burnPercent}% of ₹10,000
            </p>
          </div>
        </div>
        <div className="h-2 w-full bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
          <div 
            className={`h-full ${getProgressBarColor()} rounded-full transition-all duration-500`} 
            style={{ width: `${burnPercent}%` }}
          />
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', 'Food', 'Bills', 'Transport'].map((cat) => (
          <button 
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
              selectedCategory === cat 
                ? 'border border-primary bg-primary text-white shadow-lg shadow-primary/10' 
                : 'border border-slate-200 dark:border-white/10 text-slate-500 dark:text-dark-mute hover:border-primary/50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Simulated List of Items */}
      <div 
        className="space-y-3 min-h-[195px] transition-all duration-200"
        style={{ 
          opacity: isFading ? 0 : 1,
          transform: isFading ? 'translateY(10px)' : 'translateY(0)' 
        }}
      >
        {filteredList.map((t, index) => {
          const IconComponent = t.icon;
          return (
            <div 
              key={index}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50/40 dark:bg-white/[0.01] border border-slate-100/50 dark:border-white/[0.02] hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg ${categoryColorMap[t.color]} flex items-center justify-center`}>
                  <IconComponent className="w-[18px] h-[18px]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{t.merchant}</p>
                  <p className="text-[9px] font-mono text-slate-400 uppercase">{t.category}</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                -₹{t.amount.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
