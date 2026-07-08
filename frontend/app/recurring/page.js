'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Repeat, Plus, Trash2, CreditCard, Calendar, Tag, FileText, DollarSign } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

function RecurringManager() {
  const { user } = useAuth();
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Bills');
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  const [description, setDescription] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [currency, setCurrency] = useState('INR');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadRecurring() {
    if (!user) { setRecurring([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/recurring');
      setRecurring(res.data || []);
    } catch {
      setError('Failed to load recurring expenses');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadRecurring(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    try {
      await api.post('/recurring/add', {
        amount: parseFloat(amount),
        category,
        payment_method: paymentMethod,
        description,
        day_of_month: dayOfMonth,
        currency,
      });
      setAmount('');
      setDescription('');
      loadRecurring();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add recurring expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/recurring/${id}/delete`);
      loadRecurring();
    } catch (err) {
      setError('Failed to delete recurring expense');
    }
    setAmount('');
    setDescription('');
  };

  const totalMonthly = recurring.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to manage recurring expenses.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      <section className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 relative">
        <div className="glow-blob -top-10 -left-10 w-48 h-48 bg-primary/10"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Recurring Commitments</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Manage subscription cycles and automated billing intervals.</p>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-2 rounded-xl bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm flex items-center gap-3">
            <span className="text-[10px] font-mono text-slate-500 dark:text-dark-mute uppercase tracking-widest font-bold">Total Monthly:</span>
            <span className="text-sm font-bold text-primary dark:text-primary-light">{currency} {totalMonthly.toFixed(0)}</span>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="card-apple p-0 overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <div className="px-5 md:px-6 py-4 bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-dark-border/40 flex items-center justify-between">
              <h3 className="text-[10px] md:text-xs font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest">Active Schedules</h3>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-dark-border text-[9px] font-bold text-slate-500 dark:text-dark-mute">{recurring.length} Items</span>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[1,2].map(i => (
                  <div key={i} className="animate-pulse h-16 bg-slate-100 dark:bg-dark-border/20 rounded-xl"></div>
                ))}
              </div>
            ) : recurring.length > 0 ? (
              <div className="divide-y divide-slate-50 dark:divide-dark-border/10">
                {recurring.map((exp) => (
                  <div key={exp.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-dark-mute group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                        <Repeat className="w-[18px] h-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{exp.description || exp.category}</p>
                        <p className="text-[10px] text-slate-500 dark:text-dark-mute font-medium uppercase">
                          {exp.category} &bull; {exp.payment_method}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-600 dark:text-dark-mute border border-slate-200/50 dark:border-white/5">
                        <Calendar className="w-3.5 h-3.5" />
                        Day {exp.day_of_month}
                      </div>
                      <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">{exp.currency || 'INR'} {exp.amount?.toFixed(2)}</span>
                      <button onClick={() => setDeleteConfirm(exp.id)} className="text-slate-400 hover:text-accent-red transition-colors p-1 cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200 dark:border-white/10">
                  <Repeat className="w-8 h-8 text-slate-400 dark:text-dark-border" />
                </div>
                <p className="text-sm font-medium text-slate-500 dark:text-dark-mute">No active recurring schedules found.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4">
          <div className="card-apple p-8 sticky top-24 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Plus className="w-[18px] h-[18px]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">New Loop</h3>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">
                  Monthly Amount ({currency})
                </label>
                <div className="relative flex items-center">
                  <DollarSign className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-mono font-bold text-slate-900 dark:text-white"
                    placeholder="0.00" required />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors">Currency</label>
                <div className="relative flex items-center">
                  <CreditCard className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                    {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Billing Day (1-28)</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                  <input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white" required />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Allocation</label>
                <div className="relative flex items-center">
                  <Tag className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer" required>
                    <option value="Bills">Bills & Rent</option>
                    <option value="Food">Subscription Box</option>
                    <option value="Entertainment">Streaming Service</option>
                    <option value="Health">Gym / Insurance</option>
                    <option value="Transport">Public Transit</option>
                    <option value="Other">Miscellaneous</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Payment Method</label>
                <div className="relative flex items-center">
                  <CreditCard className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                    <option value="Bank">Bank Transfer / UPI</option>
                    <option value="Cash">Physical Cash</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Schedule Name</label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white"
                    placeholder="e.g. Netflix Monthly" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn-primary w-full py-3.5 text-xs font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group cursor-pointer">
                  Initialize Schedule
                  <Plus className="w-[18px] h-[18px]" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm);
          setDeleteConfirm(null);
        }}
        title="Delete Recurring Expense"
        message="Remove this recurring schedule? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default function RecurringPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <RecurringManager />
        </main>
        <Footer />
      </div>
  );
}
