'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import {
  Plus, TrendingUp, TrendingDown, Wallet, BarChart3, Search,
  Calendar, DollarSign, CheckCircle, AlertTriangle, Receipt,
  ArrowUpRight
} from 'lucide-react';

function DashboardContent() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/dashboard');
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  if (authLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {[1,2,3].map(i => (
            <div key={i} className="card-apple p-6 md:p-8 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-dark-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
        <div className="card-apple p-0 animate-pulse">
          <div className="h-64 bg-slate-200 dark:bg-dark-border rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute mb-4">Sign in to view your dashboard.</p>
        <Link href="/login" className="btn-primary px-6 py-2.5 text-sm font-bold">Sign In</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium mb-4">
          {error}
        </div>
        <button onClick={loadDashboard} className="btn-primary px-6 py-2.5 text-sm font-bold cursor-pointer">Retry</button>
      </div>
    );
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      {/* Top Stats Bar */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-10">
        <div className="card-apple p-6 md:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 dark:from-dark-card dark:to-dark-card/60 md:col-span-1">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-[0.2em] mb-2">OPERATIONAL CONSOLE</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Welcome, {user?.name || 'User'}</h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-dark-mute mt-2 max-w-[320px]">Your financial ledger is synchronized and active for the current fiscal period.</p>
          </div>
          <div className="mt-6 md:mt-8 flex gap-2 md:gap-3 relative z-10">
            <Link href="/expenses/add" className="flex-1 md:flex-none btn-primary px-3 md:px-6 py-3 md:py-2.5 text-xs font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 !rounded-xl">
              <Plus className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Record</span> Entry
            </Link>
            <Link href="/income/add" className="flex-1 md:flex-none btn-secondary px-3 md:px-6 py-3 md:py-2.5 text-xs font-bold flex items-center justify-center gap-2 !rounded-xl">
              <TrendingUp className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">Record</span> Income
            </Link>
            <Link href="/receipt/scan" className="hidden sm:flex btn-secondary px-6 py-2.5 text-xs font-bold items-center gap-2">
              <Receipt className="w-[18px] h-[18px]" />
              Digitize
            </Link>
          </div>
        </div>

        <div className="card-apple p-6 md:p-8 flex flex-col justify-between hover-lift">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Net Savings</p>
                <p className={`text-2xl md:text-3xl font-mono font-bold ${net_savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  {net_savings >= 0 ? '' : '-'}₹{Math.abs(net_savings).toFixed(0)}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${net_savings >= 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {net_savings >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
            </div>
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100 dark:border-dark-border/40">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500 dark:text-dark-mute">Income</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{current_month_income.toFixed(0)}</span>
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                <span className="text-slate-500 dark:text-dark-mute">Spent</span>
                <span className="font-mono font-bold text-red-500">₹{current_month_spent.toFixed(0)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card-apple p-6 md:p-8 flex flex-col justify-between hover-lift">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Monthly Burn</p>
                <p className="text-2xl md:text-3xl font-mono font-bold text-slate-900 dark:text-white">₹{current_month_spent.toFixed(0)}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t border-slate-100 dark:border-dark-border/40">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-slate-500 dark:text-dark-mute uppercase tracking-tighter">Budget</span>
                <span className="text-[10px] font-mono font-bold text-slate-900 dark:text-white">{budget_pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${budget_pct}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        {/* Left Column - Expenses Table */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick actions bar */}
          <div className="card-apple p-4 flex flex-wrap items-center gap-4 bg-white/60 dark:bg-dark-card/60 backdrop-blur-md border-white/60 dark:border-white/5">
            <div className="flex gap-2 items-center flex-1">
              <div className="relative flex-1 max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-[18px] h-[18px]" />
                <input type="text" placeholder="Search ledger..."
                  className="w-full bg-slate-100/50 dark:bg-white/5 border-none py-2.5 pl-10 pr-4 rounded-xl text-xs font-medium focus:ring-2 focus:ring-primary/20 transition-all outline-none text-slate-800 dark:text-white" />
              </div>
            </div>
          </div>

          {/* Transaction Table */}
          <div className="card-apple p-0 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-[0.2em] border-b border-slate-100 dark:border-dark-border/40">
                    <th className="px-6 py-5 font-bold">Entry Date</th>
                    <th className="px-6 py-5 font-bold">Allocation & Memo</th>
                    <th className="px-6 py-5 font-bold text-right">Amount</th>
                    <th className="px-6 py-5 font-bold text-right">Channel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-dark-border/10">
                  {expenses.length > 0 ? expenses.slice(0, 10).map((exp) => (
                    <tr key={exp._id || exp.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-all duration-300">
                      <td className="px-6 py-5">
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-dark-mute">{exp.date}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-dark-mute transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{exp.description || exp.category}</p>
                            <p className="text-[10px] text-slate-500 dark:text-dark-mute font-medium uppercase tracking-tight">{exp.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-sm font-mono font-bold text-slate-900 dark:text-white tracking-tighter">
                          ₹{exp.amount?.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-[9px] font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest border border-slate-200/50 dark:border-white/5">
                          {exp.payment_method || 'Cash'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-24 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <BarChart3 className="w-16 h-16 mb-4 text-slate-400 dark:text-dark-border" />
                          <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">No Ledger Entries Found</p>
                          <p className="text-[10px] mt-2 max-w-[240px] mx-auto text-slate-400">Initialize your ledger by recording a new transaction or digitizing a voucher.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden divide-y divide-slate-100 dark:divide-dark-border/10">
              {expenses.length > 0 ? expenses.slice(0, 5).map((exp) => (
                <div key={exp._id || exp.id} className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-dark-mute shrink-0">
                        <DollarSign className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{exp.description || exp.category}</p>
                        <p className="text-[10px] text-slate-500 dark:text-dark-mute font-medium">{exp.category} &middot; {exp.date}</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white shrink-0">₹{exp.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-[9px] font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest border border-slate-200/50 dark:border-white/5">
                      {exp.payment_method || 'Cash'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="px-4 py-16 text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-dark-border" />
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">No Entries Found</p>
                  <p className="text-[10px] mt-2 max-w-[200px] mx-auto text-slate-400">Record a transaction to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Analytics */}
        <div className="lg:col-span-4 space-y-4 md:space-y-6">
          {/* This Month Card */}
          <div className="card-apple p-5 md:p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">THIS MONTH</h3>
            </div>
            <div className="space-y-3 md:space-y-4">
              <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-slate-100 dark:border-dark-border/40">
                <span className="text-xs font-medium text-slate-500 dark:text-dark-mute">Income</span>
                <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{current_month_income.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-slate-100 dark:border-dark-border/40">
                <span className="text-xs font-medium text-slate-500 dark:text-dark-mute">Spent so far</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">₹{current_month_spent.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-slate-100 dark:border-dark-border/40">
                <span className="text-xs font-medium text-slate-500 dark:text-dark-mute">Net Savings</span>
                <span className={`text-sm font-mono font-bold ${net_savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  ₹{net_savings.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 md:pb-4 border-b border-slate-100 dark:border-dark-border/40">
                <span className="text-xs font-medium text-slate-500 dark:text-dark-mute">Monthly budget</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">₹{monthly_budget.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-slate-500 dark:text-dark-mute">Projected total</span>
                <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">₹{projected_total.toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-4 md:mt-6">
              {projected_total <= monthly_budget ? (
                <div className="bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 rounded-xl p-4 flex gap-3 items-start">
                  <CheckCircle className="w-[18px] h-[18px] text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">On Track</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-mute leading-tight">Expense trajectory is within safety limits.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-xl p-4 flex gap-3 items-start">
                  <AlertTriangle className="w-[18px] h-[18px] text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 mb-1">Over Budget</p>
                    <p className="text-[10px] text-slate-500 dark:text-dark-mute leading-tight">Projected spending will exceed the monthly budget.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Accounts Card */}
          <div className="card-apple p-5 md:p-6 shadow-xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <div className="flex items-center gap-2 mb-4 md:mb-6">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">ACCOUNTS</h3>
            </div>
            <div className="space-y-3">
              {accounts_data.length > 0 ? accounts_data.slice(0, 5).map((acc) => (
                <div key={acc._id || acc.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-dark-border/40 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${acc.type === 'bank' ? 'bg-blue-500' : acc.type === 'cash' ? 'bg-emerald-500' : acc.type === 'credit_card' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                    <span className="text-xs font-medium text-slate-600 dark:text-dark-mute">{acc.name}</span>
                  </div>
                  <span className={`text-xs font-mono font-bold ${(acc.balance || 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-red-500'}`}>
                    {acc.currency || 'INR'} {(acc.balance || 0).toFixed(0)}
                  </span>
                </div>
              )) : (
                <>
                  <p className="text-xs text-slate-500 dark:text-dark-mute text-center py-4">No accounts set up yet.</p>
                  <Link href="/accounts" className="block text-center text-[10px] font-bold text-primary">Create Account →</Link>
                </>
              )}
              {accounts_data.length > 0 && (
                <Link href="/accounts" className="block text-center text-[10px] font-bold text-primary hover:text-primary-light pt-2 transition-colors">Manage Accounts →</Link>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="card-apple p-5 md:p-6 bg-slate-900 dark:bg-[#0B0F19] hover:bg-slate-800 dark:hover:bg-[#111622] border border-slate-800 dark:border-slate-800/80 text-white flex items-center justify-between group cursor-pointer transition-all duration-300 shadow-lg active:scale-[0.98]" onClick={() => window.location = '/reports'}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <h4 className="text-sm font-bold tracking-tight text-slate-100">View Reports</h4>
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-300 font-medium">Deep-dive analytics & annual trends</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center transition-all group-hover:-translate-y-0.5 group-active:scale-95 shrink-0">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <DashboardContent />
        </main>
        <Footer />
      </div>
  );
}
