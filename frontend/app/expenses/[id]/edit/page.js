'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, api } from '../../../../components/AuthContext';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import { ArrowRight, DollarSign, Tag, FileText, Calendar, CreditCard, ShoppingCart, Save } from 'lucide-react';

const CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];
const PAYMENT_METHODS = ['Cash', 'Bank', 'Credit Card', 'UPI', 'Debit Card', 'Wallet'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];

function EditExpenseForm() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const expenseId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [description, setDescription] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [date, setDate] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [customCategories, setCustomCategories] = useState([]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadData() {
      try {
        const [expenseRes, accountsRes, tagsRes, catsRes] = await Promise.all([
          api.get(`/api/expenses/${expenseId}`),
          api.get('/api/accounts'),
          api.get('/api/tags'),
          api.get('/api/categories'),
        ]);

        if (cancelled) return;

        const expense = expenseRes.data;

        setAmount(String(expense.amount || ''));
        setCategory(expense.category || 'Food');
        setDescription(expense.description || '');
        setPaymentMethod(expense.payment_method || 'Cash');
        setDate(expense.date || '');
        setCurrency(expense.currency || 'INR');
        setAccountId(expense.account_id || '');

        const activeAccounts = (accountsRes.data || []).filter(a => a.is_active !== false);
        setAccounts(activeAccounts);

        setTags(tagsRes.data || []);
        setCustomCategories(catsRes.data || []);
        setSelectedTags(expense.tags || []);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError(err.response?.data?.error || 'Failed to load expense.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, [user, expenseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/expenses/${expenseId}/edit`, {
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
      setError(err.response?.data?.error || 'Failed to update expense.');
    } finally {
      setSaving(false);
    }
  };

  const toggleTag = (id) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to edit expenses.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-20">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-slate-200 dark:bg-white/5 rounded-lg" />
          <div className="h-4 w-64 bg-slate-200 dark:bg-white/5 rounded-lg" />
          <div className="card-apple p-8 space-y-6">
            <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl" />
            <div className="grid grid-cols-2 gap-6">
              <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl" />
              <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl" />
            </div>
            <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl" />
            <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl" />
            <div className="h-12 bg-slate-200 dark:bg-white/5 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in-up">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2">Expense Not Found</h1>
        <p className="text-sm text-slate-500 dark:text-dark-mute mb-6">This expense doesn't exist or has been deleted.</p>
        <button onClick={() => router.push('/dashboard')}
          className="btn-primary px-6 py-3 text-sm font-bold rounded-full cursor-pointer">
          Back to Dashboard
        </button>
      </div>
    );
  }

  const combinedCategories = [
    ...CATEGORIES,
    ...customCategories.map(c => c.name).filter(name => !CATEGORIES.includes(name)),
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-0.5 rounded bg-signature-coral/10 text-signature-coral text-[10px] font-bold uppercase tracking-widest">Edit Entry</span>
        </div>
        <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Modify Transaction</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">
          Updating entry #{expenseId.slice(-6)} in the personal ledger.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="card-apple p-6 md:p-8 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">
                Amount ({currency})
              </label>
              <div className="relative flex items-center">
                <DollarSign className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-mono font-bold text-slate-900 dark:text-white"
                  placeholder="0.00" required autoFocus />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors">Currency</label>
              <div className="relative flex items-center">
                <CreditCard className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c} &mdash; {c === 'INR' ? '\u20B9' : c === 'USD' ? '$' : c === 'EUR' ? '\u20AC' : c === 'GBP' ? '\u00A3' : c === 'JPY' ? '\u00A5' : c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Transaction Date</label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white" required />
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Allocation</label>
              <div className="relative flex items-center">
                <Tag className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={category} onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer" required>
                  <optgroup label="Default">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </optgroup>
                  {customCategories.length > 0 && (
                    <optgroup label="Custom">
                      {customCategories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}
                    </optgroup>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Payment Channel</label>
              <div className="relative flex items-center">
                <ShoppingCart className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                  {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2 group">
              <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors">Account (Optional)</label>
              <div className="relative flex items-center">
                <CreditCard className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer">
                  <option value="">No account</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-2 group">
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">Memo / Description</label>
            <div className="relative flex items-center">
              <FileText className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-3 md:py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white"
                placeholder="Enter transaction details..." />
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

          <div className="flex gap-3 md:gap-4 pt-6 border-t border-slate-100 dark:border-dark-border/40">
            <button type="submit" disabled={saving}
              className="btn-primary flex-1 py-3.5 md:py-3 text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group !rounded-xl cursor-pointer disabled:opacity-50">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Save className="w-[18px] h-[18px]" />
                  Update Entry
                  <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <button type="button" onClick={() => router.push('/dashboard')}
              className="btn-secondary flex-1 py-3.5 md:py-3 text-sm font-bold flex items-center justify-center gap-2 no-underline !rounded-xl cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditExpensePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow">
        <EditExpenseForm />
      </main>
      <Footer />
    </div>
  );
}
