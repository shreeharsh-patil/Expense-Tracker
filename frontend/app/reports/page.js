'use client';

import { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { TrendingUp, TrendingDown, Download, BarChart3, Tags } from 'lucide-react';

function ReportsContent() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    setLoading(true); setError('');
    api.get(`/api/reports?year=${year}`)
      .then(res => setData(res.data))
      .catch(() => setError('Failed to load reports'))
      .finally(() => setLoading(false));
  }, [user, year]);

  if (!user) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground">Sign in to view reports.</p></div><FooterSection /></main>);
  }

  if (loading) {
    return (<main className="bg-background min-h-screen"><Navigation />
      <div className="pt-32 max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-3 gap-6 mb-8">{[1,2,3].map(i => (<div key={i} className="border border-foreground/10 p-6 animate-pulse"><div className="h-4 bg-foreground/10 rounded w-1/3 mb-4"></div><div className="h-6 bg-foreground/10 rounded w-1/2"></div></div>))}</div>
        <div className="border border-foreground/10 p-8 animate-pulse"><div className="h-[250px] bg-foreground/10"></div></div>
      </div>
    <FooterSection /></main>);
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
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-8 h-px bg-foreground/30" />{year} FISCAL YEAR
              </span>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Financial Intelligence</h1>
              <p className="text-base text-muted-foreground">Deep-dive analytics into your spending patterns and capital flow.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="border border-foreground/10 py-2 px-4 flex items-center gap-4">
                <div className="text-right shrink-0">
                  <span className="block text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Outflow</span>
                  <span className="text-base md:text-lg font-mono text-foreground tracking-tighter">{'₹'}{total_year.toFixed(0)}</span>
                </div>
                <div className="w-px h-8 bg-foreground/10 shrink-0"></div>
                <div className="text-right shrink-0">
                  <span className="block text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Inflow</span>
                  <span className="text-base md:text-lg font-mono text-emerald-500 tracking-tighter">{'₹'}{total_income_year.toFixed(0)}</span>
                </div>
                <div className="w-px h-8 bg-foreground/10 shrink-0"></div>
                <div className="text-right shrink-0">
                  <span className="block text-[8px] font-mono text-muted-foreground uppercase tracking-widest">Net</span>
                  <span className={`text-base md:text-lg font-mono tracking-tighter ${net_savings_year >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{'₹'}{net_savings_year.toFixed(0)}</span>
                </div>
              </div>
            </div>
          </div>

          {error && (<div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">{error}</div>)}

          <div className="flex gap-2 mb-8">
            {available_years.map(y => (
              <button key={y} onClick={() => setYear(y)}
                className={`px-4 py-1.5 text-[10px] font-mono uppercase tracking-widest border transition-all cursor-pointer ${
                  year === y ? 'bg-foreground border-foreground text-background' : 'border-foreground/10 text-muted-foreground hover:border-foreground/30'
                }`}>{y}</button>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <div className="border border-foreground/10 bg-foreground/[0.02] p-6 hover:border-foreground/30 transition-all group">
              <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 text-muted-foreground"><TrendingUp className="w-5 h-5" /></div>
              <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Peak Spending</h4>
              <p className="text-xl font-display">{worst_month}</p>
              <p className="text-[10px] text-red-500 mt-1 tracking-tight">Highest spending</p>
            </div>
            <div className="border border-foreground/10 bg-foreground/[0.02] p-6 hover:border-foreground/30 transition-all group">
              <div className="w-10 h-10 border border-emerald-500/30 flex items-center justify-center mb-4 transition-transform group-hover:scale-110"><TrendingDown className="w-5 h-5 text-emerald-500" /></div>
              <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Optimal Month</h4>
              <p className="text-xl font-display">{best_month}</p>
              <p className="text-[10px] text-emerald-500 mt-1 tracking-tight">Most efficient month</p>
            </div>
            <div className="border border-foreground/10 bg-foreground/[0.02] p-6 hover:border-foreground/30 transition-all group">
              <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 text-muted-foreground"><Tags className="w-5 h-5" /></div>
              <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Primary Burn</h4>
              <p className="text-xl font-display">{top_category}</p>
              <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">Top category outflow</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7">
              <div className="border border-foreground/10 bg-foreground/[0.02] p-8">
                <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-6">Categorical Distribution</h3>
                <div className="space-y-6">
                  {categories.length > 0 ? categories.map((cat, i) => {
                    const pct = total_year > 0 ? (cat.total / total_year * 100) : 0;
                    const colors = ['bg-foreground/80', 'bg-rose-500', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500', 'bg-muted-foreground'];
                    return (
                      <div key={i} className="space-y-1.5 group">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-2 h-2 rounded-full ${colors[i] || colors[6]}`}></div>
                            <span className="text-foreground/80">{cat.category}</span>
                          </div>
                          <div className="flex items-center gap-1.5 font-mono shrink-0">
                            <span className="text-foreground">{'₹'}{cat.total.toFixed(0)}</span>
                            <span className="text-[10px] text-muted-foreground hidden sm:inline">({pct.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                          <div className={`h-1.5 rounded-full ${colors[i] || colors[6]}`} style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  }) : (<div className="py-12 text-center text-sm text-muted-foreground">No expense data for this year.</div>)}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="border border-foreground/10 bg-foreground/[0.02] p-8">
                <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-6">Monthly Totals ({year})</h3>
                <div className="space-y-2 max-h-[360px] overflow-y-auto">
                  {(d.monthly_totals || []).map((total, i) => {
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    const incomeTotal = (d.income_monthly_values || [])[i] || 0;
                    const maxVal = Math.max(...(d.monthly_totals || []), ...(d.income_monthly_values || []), 1);
                    const expPct = (total / maxVal) * 100;
                    const incPct = (incomeTotal / maxVal) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3 py-1.5">
                        <span className="text-[10px] text-muted-foreground w-8 shrink-0">{monthNames[i]}</span>
                        <div className="flex-1 space-y-0.5">
                          <div className="flex items-center gap-1">
                            <div className="h-2 rounded-full bg-foreground/60" style={{ width: `${Math.max(expPct, 2)}%` }}></div>
                            <span className="text-[8px] font-mono text-muted-foreground">{'₹'}{total.toFixed(0)}</span>
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

              <div className="border border-foreground/20 bg-foreground/[0.04] hover:bg-foreground/[0.06] p-6 flex items-center justify-between group cursor-pointer transition-all duration-300 active:scale-[0.98]"
                onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/expenses/export`}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-sm font-medium text-foreground">Full Data Export</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Download CSV ledger for spreadsheets</p>
                </div>
                <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center transition-all group-hover:-translate-y-0.5 shrink-0">
                  <Download className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <FooterSection />
    </main>
  );
}

export default function ReportsPage() {
  return <ReportsContent />;
}
