'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  TrendingUp, TrendingDown, Download, ArrowUpRight, BarChart3,
  PieChart, Tags, Award
} from 'lucide-react';

function ReportsContent() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError('');
    api.get(`/api/reports?year=${year}`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [user, year]);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to view reports.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="card-apple p-5 md:p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-1/3 mb-4"></div>
              <div className="h-6 bg-slate-200 dark:bg-dark-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="card-apple p-5 md:p-8 animate-pulse">
          <div className="h-[250px] bg-slate-200 dark:bg-dark-border rounded-xl"></div>
        </div>
      </div>
    );
  }

  const d = data || {};
  const total_year = d.total_year || 0;
  const total_income_year = d.total_income_year || 0;
  const net_savings_year = d.net_savings_year || 0;
  const categories = d.categories || [];
  const cat_labels = d.labels || [];
  const cat_values = d.values || [];
  const available_years = d.available_years || [new Date().getFullYear().toString()];
  const best_month = d.best_month || '—';
  const worst_month = d.worst_month || '—';
  const top_category = cat_labels[0] || 'N/A';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 relative">
        <div className="glow-blob -top-10 -left-10 w-48 h-48 bg-primary/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">{year} FISCAL YEAR</span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Financial Intelligence</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Deep-dive analytics into your spending patterns and capital flow.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="card-apple py-2 px-4 flex items-center gap-4 bg-white/50 dark:bg-white/5">
            <div className="text-right shrink-0">
              <span className="block text-[8px] font-mono text-slate-400 dark:text-dark-mute uppercase tracking-widest font-bold">Outflow</span>
              <span className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tighter">{'₹'}{total_year.toFixed(0)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-dark-border shrink-0"></div>
            <div className="text-right shrink-0">
              <span className="block text-[8px] font-mono text-slate-400 dark:text-dark-mute uppercase tracking-widest font-bold">Inflow</span>
              <span className="text-base md:text-lg font-bold text-emerald-600 dark:text-emerald-400 tracking-tighter">{'₹'}{total_income_year.toFixed(0)}</span>
            </div>
            <div className="w-px h-8 bg-slate-200 dark:bg-dark-border shrink-0"></div>
            <div className="text-right shrink-0">
              <span className="block text-[8px] font-mono text-slate-400 dark:text-dark-mute uppercase tracking-widest font-bold">Net</span>
              <span className={`text-base md:text-lg font-bold tracking-tighter ${net_savings_year >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {'₹'}{net_savings_year.toFixed(0)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Year Selector */}
      <div className="flex gap-2 mb-6">
        {available_years.map(y => (
          <button key={y} onClick={() => setYear(y)}
            className={`px-4 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-widest border transition-all cursor-pointer ${
              year === y
                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-dark-mute hover:border-primary/50'
            }`}>
            {y}
          </button>
        ))}
      </div>

      {/* Insights Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="card-apple p-5 md:p-6 hover-lift border-primary/10 group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-1">Peak Spending</h4>
          <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{worst_month}</p>
          <p className="text-[10px] text-red-500 font-bold mt-1 tracking-tight">Highest spending</p>
        </div>

        <div className="card-apple p-5 md:p-6 hover-lift border-emerald-500/10 group">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <TrendingDown className="w-5 h-5" />
          </div>
          <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-1">Optimal Month</h4>
          <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{best_month}</p>
          <p className="text-[10px] text-emerald-500 font-bold mt-1 tracking-tight">Most efficient month</p>
        </div>

        <div className="card-apple p-5 md:p-6 hover-lift border-rose-500/10 group">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
            <Tags className="w-5 h-5" />
          </div>
          <h4 className="text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-1">Primary Burn</h4>
          <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">{top_category}</p>
          <p className="text-[10px] text-rose-500 font-bold mt-1 tracking-tight">Top category outflow</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
        {/* Category Breakdown */}
        <div className="lg:col-span-7">
          <div className="card-apple p-5 md:p-8 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <h3 className="text-[10px] md:text-xs font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-6">Categorical Distribution</h3>

            <div className="space-y-4 md:space-y-6">
              {categories.length > 0 ? categories.map((cat, i) => {
                const pct = total_year > 0 ? (cat.total / total_year * 100) : 0;
                return (
                  <div key={i} className="space-y-1.5 group">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-rose-500' : i === 2 ? 'bg-emerald-500' : i === 3 ? 'bg-amber-500' : i === 4 ? 'bg-blue-500' : i === 5 ? 'bg-purple-500' : 'bg-slate-400'}`}></div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{cat.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono shrink-0">
                        <span className="font-bold text-slate-900 dark:text-white">{'₹'}{cat.total.toFixed(0)}</span>
                        <span className="text-[10px] text-slate-400 dark:text-dark-mute hidden sm:inline">({pct.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                      <div className={`h-1.5 rounded-full ${i === 0 ? 'bg-primary' : i === 1 ? 'bg-rose-500' : i === 2 ? 'bg-emerald-500' : i === 3 ? 'bg-amber-500' : i === 4 ? 'bg-blue-500' : i === 5 ? 'bg-purple-500' : 'bg-slate-400'}`}
                        style={{ width: `${pct}%` }}>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="py-12 text-center text-sm text-slate-400">No expense data for this year.</div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 space-y-4 md:space-y-6">
          {/* Monthly breakdown summary */}
          <div className="card-apple p-5 md:p-8 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <h3 className="text-[10px] md:text-xs font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-6">Monthly Totals ({year})</h3>
            <div className="space-y-2 max-h-[360px] overflow-y-auto">
              {(d.monthly_totals || []).map((total, i) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const incomeTotal = (d.income_monthly_values || [])[i] || 0;
                const maxVal = Math.max(...(d.monthly_totals || []), ...(d.income_monthly_values || []), 1);
                const expPct = (total / maxVal) * 100;
                const incPct = (incomeTotal / maxVal) * 100;
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-dark-mute w-8 shrink-0">{monthNames[i]}</span>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="h-2 rounded-full bg-primary/60" style={{ width: `${Math.max(expPct, 2)}%` }}></div>
                        <span className="text-[8px] font-mono text-slate-400">{'₹'}{total.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-2 rounded-full bg-emerald-500/60" style={{ width: `${Math.max(incPct, 2)}%` }}></div>
                        <span className="text-[8px] font-mono text-emerald-500">{'₹'}{incomeTotal.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Card */}
          <div className="card-apple p-5 md:p-6 bg-slate-900 dark:bg-[#0B0F19] hover:bg-slate-800 dark:hover:bg-[#111622] border border-slate-800 dark:border-slate-800/80 text-white flex items-center justify-between group cursor-pointer transition-all duration-300 shadow-lg active:scale-[0.98]"
            onClick={() => window.location = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/expenses/export`}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-sm font-bold tracking-tight text-slate-100">Full Data Export</h4>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-300 font-medium">Download CSV ledger for spreadsheets</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center transition-all group-hover:-translate-y-0.5 group-active:scale-95 shrink-0">
              <Download className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <ReportsContent />
        </main>
        <Footer />
      </div>
  );
}
