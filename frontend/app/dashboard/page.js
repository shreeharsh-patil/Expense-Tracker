'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import {
  Plus, TrendingUp, TrendingDown, Wallet, BarChart3, Search,
  Calendar, DollarSign, CheckCircle, AlertTriangle, Receipt, ArrowUpRight
} from 'lucide-react';

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (err) { setError(err.response?.data?.error || 'Failed to load dashboard'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (authLoading || loading) {
    return (
      <main className="bg-background min-h-screen"><Navigation />
        <div className="pt-32 max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1,2,3].map(i => (<div key={i} className="border border-foreground/10 p-8 animate-pulse"><div className="h-4 bg-foreground/10 rounded w-1/3 mb-4"></div><div className="h-8 bg-foreground/10 rounded w-1/2"></div></div>))}
          </div>
          <div className="border border-foreground/10 animate-pulse"><div className="h-64 bg-foreground/10"></div></div>
        </div>
        <FooterSection />
      </main>
    );
  }

  if (!user) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground mb-4">Sign in to view your dashboard.</p><Link href="/login" className="px-6 py-2.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all">Sign In</Link></div><FooterSection /></main>);
  }

  if (error) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><div className="p-4 border border-foreground/10 text-muted-foreground text-xs font-medium mb-4">{error}</div><button onClick={loadDashboard} className="px-6 py-2.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer">Retry</button></div><FooterSection /></main>);
  }

  const d = data || {};
  const current_month_spent = d.current_month_spent || 0;
  const current_month_income = d.current_month_income || 0;
  const net_savings = d.net_savings !== undefined ? d.net_savings : (current_month_income - current_month_spent);
  const monthly_budget = d.monthly_budget || 10000;
  const budget_pct = monthly_budget > 0 ? Math.min(Math.round((current_month_spent / monthly_budget) * 100), 100) : 0;
  const projected_total = d.projected_total || 0;
  const expenses = d.expenses || [];
  const accounts_data = d.accounts_data || [];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-7xl mx-auto">
          {/* Top Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="border border-foreground/10 bg-foreground/[0.02] p-8 flex flex-col justify-between relative overflow-hidden md:col-span-1">
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">OPERATIONAL CONSOLE</p>
                <h1 className="text-2xl md:text-3xl font-display tracking-tight">Welcome, {user?.name || 'User'}</h1>
                <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-[320px]">Your financial ledger is synchronized and active for the current fiscal period.</p>
              </div>
              <div className="mt-8 flex gap-3 relative z-10">
                <Link href="/expenses/add" className="flex-1 md:flex-none px-3 md:px-6 py-3 md:py-2.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2">
                  <Plus className="w-[18px] h-[18px]" /><span className="hidden sm:inline">Record</span> Entry
                </Link>
                <Link href="/income/add" className="flex-1 md:flex-none px-3 md:px-6 py-3 md:py-2.5 text-xs font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all flex items-center justify-center gap-2">
                  <TrendingUp className="w-[18px] h-[18px]" /><span className="hidden sm:inline">Record</span> Income
                </Link>
                <Link href="/receipt/scan" className="hidden sm:flex px-6 py-2.5 text-xs font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all items-center gap-2">
                  <Receipt className="w-[18px] h-[18px]" />Digitize
                </Link>
              </div>
            </div>

            <div className="border border-foreground/10 bg-foreground/[0.02] p-8 flex flex-col justify-between hover:border-foreground/30 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Net Savings</p>
                    <p className={`text-2xl md:text-3xl font-mono ${net_savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {net_savings >= 0 ? '' : '-'}{'₹'}{Math.abs(net_savings).toFixed(0)}
                    </p>
                  </div>
                  <div className={`w-10 h-10 border flex items-center justify-center shrink-0 ${net_savings >= 0 ? 'border-emerald-500/30' : 'border-red-500/30'}`}>
                    {net_savings >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-foreground/10">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Income</span>
                    <span className="font-mono text-emerald-500">{'₹'}{current_month_income.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="font-mono text-red-500">{'₹'}{current_month_spent.toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-foreground/10 bg-foreground/[0.02] p-8 flex flex-col justify-between hover:border-foreground/30 transition-all">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Monthly Burn</p>
                    <p className="text-2xl md:text-3xl font-mono text-foreground">{'₹'}{current_month_spent.toFixed(0)}</p>
                  </div>
                  <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-foreground/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-tight">Budget</span>
                    <span className="text-[10px] font-mono text-foreground">{budget_pct}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-foreground/10 rounded-full overflow-hidden">
                    <div className="h-full bg-foreground/60 rounded-full transition-all duration-1000" style={{ width: `${budget_pct}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column - Expenses Table */}
            <div className="lg:col-span-8 space-y-6">
              {/* Quick actions bar */}
              <div className="border border-foreground/10 bg-foreground/[0.02] p-4 flex flex-wrap items-center gap-4">
                <div className="flex gap-2 items-center flex-1">
                  <div className="relative flex-1 max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-[18px] h-[18px]" />
                    <input type="text" placeholder="Search ledger..."
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-8 pr-4 text-xs outline-none focus:border-foreground/40 transition-all text-foreground" />
                  </div>
                </div>
              </div>

              {/* Transaction Table */}
              <div className="border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest border-b border-foreground/10">
                        <th className="px-6 py-5 font-medium">Entry Date</th>
                        <th className="px-6 py-5 font-medium">Allocation & Memo</th>
                        <th className="px-6 py-5 font-medium text-right">Amount</th>
                        <th className="px-6 py-5 font-medium text-right">Channel</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-foreground/10">
                      {expenses.length > 0 ? expenses.slice(0, 10).map((exp) => (
                        <tr key={exp._id || exp.id} className="group hover:bg-foreground/[0.01] transition-all duration-300">
                          <td className="px-6 py-5"><span className="text-xs font-mono text-muted-foreground">{exp.date}</span></td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 border border-foreground/10 flex items-center justify-center text-muted-foreground transition-colors group-hover:border-foreground/30">
                                <DollarSign className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm text-foreground">{exp.description || exp.category}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{exp.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-right"><span className="text-sm font-mono text-foreground">{'₹'}{exp.amount?.toFixed(2)}</span></td>
                          <td className="px-6 py-5 text-right">
                            <span className="px-2 py-1 border border-foreground/10 text-[9px] text-muted-foreground uppercase tracking-widest">{exp.payment_method || 'Cash'}</span>
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan="4" className="px-6 py-24 text-center">
                          <div className="flex flex-col items-center opacity-40">
                            <BarChart3 className="w-16 h-16 mb-4 text-muted-foreground" />
                            <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">No Ledger Entries Found</p>
                            <p className="text-[10px] mt-2 max-w-[240px] mx-auto text-muted-foreground">Initialize your ledger by recording a new transaction or digitizing a voucher.</p>
                          </div>
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-foreground/10">
                  {expenses.length > 0 ? expenses.slice(0, 5).map((exp) => (
                    <div key={exp._id || exp.id} className="p-4 space-y-3 hover:bg-foreground/[0.01] transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center text-muted-foreground shrink-0">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{exp.description || exp.category}</p>
                            <p className="text-[10px] text-muted-foreground">{exp.category} &middot; {exp.date}</p>
                          </div>
                        </div>
                        <span className="text-sm font-mono text-foreground shrink-0">{'₹'}{exp.amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-16 text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">No Entries Found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Analytics */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border border-foreground/10 bg-foreground/[0.02] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-xs font-medium text-foreground uppercase tracking-widest">THIS MONTH</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-foreground/10">
                    <span className="text-xs text-muted-foreground">Income</span>
                    <span className="text-sm font-mono text-emerald-500">{'₹'}{current_month_income.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-foreground/10">
                    <span className="text-xs text-muted-foreground">Spent so far</span>
                    <span className="text-sm font-mono text-foreground">{'₹'}{current_month_spent.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-foreground/10">
                    <span className="text-xs text-muted-foreground">Net Savings</span>
                    <span className={`text-sm font-mono ${net_savings >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{'₹'}{net_savings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-foreground/10">
                    <span className="text-xs text-muted-foreground">Monthly budget</span>
                    <span className="text-sm font-mono text-foreground">{'₹'}{monthly_budget.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">Projected total</span>
                    <span className="text-sm font-mono text-foreground">{'₹'}{projected_total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-6">
                  {projected_total <= monthly_budget ? (
                    <div className="border border-emerald-500/10 p-4 flex gap-3 items-start">
                      <CheckCircle className="w-[18px] h-[18px] text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-foreground mb-1">On Track</p>
                        <p className="text-[10px] text-muted-foreground">Expense trajectory is within safety limits.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-red-500/10 p-4 flex gap-3 items-start">
                      <AlertTriangle className="w-[18px] h-[18px] text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-red-500 mb-1">Over Budget</p>
                        <p className="text-[10px] text-muted-foreground">Projected spending will exceed the monthly budget.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-foreground/10 bg-foreground/[0.02] p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Wallet className="w-5 h-5 text-muted-foreground" />
                  <h3 className="text-xs font-medium text-foreground uppercase tracking-widest">ACCOUNTS</h3>
                </div>
                <div className="space-y-3">
                  {accounts_data.length > 0 ? accounts_data.slice(0, 5).map((acc) => (
                    <div key={acc._id || acc.id} className="flex items-center justify-between py-2 border-b border-foreground/10 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${acc.type === 'bank' ? 'bg-blue-500' : acc.type === 'cash' ? 'bg-emerald-500' : acc.type === 'credit_card' ? 'bg-red-500' : 'bg-muted-foreground'}`}></span>
                        <span className="text-xs text-muted-foreground">{acc.name}</span>
                      </div>
                      <span className={`text-xs font-mono ${(acc.balance || 0) >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                        {acc.currency || 'INR'} {(acc.balance || 0).toFixed(0)}
                      </span>
                    </div>
                  )) : (
                    <>
                      <p className="text-xs text-muted-foreground text-center py-4">No accounts set up yet.</p>
                      <Link href="/accounts" className="block text-center text-[10px] text-foreground/70 hover:text-foreground">Create Account →</Link>
                    </>
                  )}
                  {accounts_data.length > 0 && (
                    <Link href="/accounts" className="block text-center text-[10px] text-foreground/70 hover:text-foreground pt-2 transition-colors">Manage Accounts →</Link>
                  )}
                </div>
              </div>

              <div className="border border-foreground/20 bg-foreground/[0.04] hover:bg-foreground/[0.06] p-6 flex items-center justify-between group cursor-pointer transition-all duration-300 active:scale-[0.98]" onClick={() => window.location = '/reports'}>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <h4 className="text-sm font-medium text-foreground">View Reports</h4>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Deep-dive analytics & annual trends</p>
                </div>
                <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center transition-all group-hover:-translate-y-0.5 shrink-0">
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground" />
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

export default function DashboardPage() {
  return <DashboardContent />;
}
