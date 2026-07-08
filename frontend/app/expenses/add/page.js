'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, api } from '../../../components/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { ArrowRight, DollarSign, Tag, FileText, Calendar, CreditCard, ShoppingCart } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank', 'Credit Card', 'UPI', 'Debit Card', 'Wallet'];

function AddExpenseForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('INR');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      Promise.all([
        api.get('/api/accounts'),
        api.get('/api/tags')
      ]).then(([accRes, tagRes]) => {
        setAccounts(accRes.data?.filter(a => a.is_active !== false) || []);
        setTags(tagRes.data || []);
      }).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/expenses/add', {
        amount: parseFloat(amount),
        category,
        description,
        payment_method: paymentMethod,
        date,
        currency,
        account_id: accountId || null,
        tag_ids: selectedTags,
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add expense.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (id) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to record expenses.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">New Entry</span>
        </div>
        <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Record Expense</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Log a new expense entry to your financial ledger.</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="card-apple p-8 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2 group">
            <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">
              Amount ({currency})
            </label>
            <div className="relative flex items-center">
              <DollarSign className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
              <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-mono font-bold text-slate-900 dark:text-white"
                placeholder="0.00" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors">Currency</label>
              <div className="relative flex items-center">
                <CreditCard className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                  {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Category</label>
              <div className="relative flex items-center">
                <Tag className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer" required>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Date</label>
            <div className="relative flex items-center">
              <Calendar className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white" required />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Payment Method</label>
              <div className="relative flex items-center">
                <ShoppingCart className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {accounts.length > 0 && (
              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors">Account (Optional)</label>
                <div className="relative flex items-center">
                  <CreditCard className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
                  <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                    <option value="">No account</option>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2 group">
            <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Description (Optional)</label>
            <div className="relative flex items-center">
              <FileText className="absolute left-0 text-slate-300 dark:text-dark-border w-[18px] h-[18px]" />
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white"
                placeholder="e.g. Lunch at restaurant" />
            </div>
          </div>

          {tags.length > 0 && (
            <div className="space-y-2">
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${
                      selectedTags.includes(tag.id)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-dark-mute hover:border-primary/50'
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }}></span>
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group !rounded-full disabled:opacity-50 cursor-pointer">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Record Expense
                  <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AddExpensePage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <AddExpenseForm />
        </main>
        <Footer />
      </div>
  );
}
