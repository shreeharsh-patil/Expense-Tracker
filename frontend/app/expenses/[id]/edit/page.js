'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth, api } from '../../../../components/AuthContext';
import { Navigation } from '../../../../components/landing/navigation';
import { FooterSection } from '../../../../components/landing/footer-section';
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
        setAccounts((accountsRes.data || []).filter(a => a.is_active !== false));
        setTags(tagsRes.data || []);
        setCustomCategories(catsRes.data || []);
        setSelectedTags(expense.tags || []);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 404) setNotFound(true);
        else setError(err.response?.data?.error || 'Failed to load expense.');
      } finally { if (!cancelled) setLoading(false); }
    }
    loadData();
    return () => { cancelled = true; };
  }, [user, expenseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setSaving(true);
    try {
      await api.post(`/expenses/${expenseId}/edit`, {
        amount: parseFloat(amount), category, description, payment_method: paymentMethod,
        date, currency, account_id: accountId || null, tag_ids: selectedTags,
      });
      router.push('/dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Failed to update expense.'); }
    finally { setSaving(false); }
  };

  const toggleTag = (id) => {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  };

  if (!user) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground">Sign in to edit expenses.</p></div><FooterSection /></main>);
  }

  if (loading) {
    return (<main className="bg-background min-h-screen"><Navigation />
      <div className="pt-32 max-w-2xl mx-auto px-6 lg:px-12"><div className="animate-pulse space-y-6">
        <div className="h-8 w-48 bg-foreground/10" /><div className="h-4 w-64 bg-foreground/10" />
        <div className="border border-foreground/10 p-8 space-y-6"><div className="h-12 bg-foreground/10" /><div className="grid grid-cols-2 gap-6"><div className="h-12 bg-foreground/10" /><div className="h-12 bg-foreground/10" /></div><div className="h-12 bg-foreground/10" /><div className="h-12 bg-foreground/10" /><div className="h-12 bg-foreground/10" /></div>
      </div></div>
    <FooterSection /></main>);
  }

  if (notFound) {
    return (<main className="bg-background min-h-screen"><Navigation />
      <div className="pt-32 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 border border-foreground/10 flex items-center justify-center mx-auto mb-4"><FileText className="w-7 h-7 text-muted-foreground" /></div>
        <h1 className="text-2xl font-display mb-2">Expense Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">This expense doesn&apos;t exist or has been deleted.</p>
        <button onClick={() => router.push('/dashboard')} className="px-6 py-3 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer">Back to Dashboard</button>
      </div>
    <FooterSection /></main>);
  }

  const combinedCategories = [...CATEGORIES, ...customCategories.map(c => c.name).filter(name => !CATEGORIES.includes(name))];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />Edit Entry
            </span>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Modify Transaction</h1>
            <p className="text-base text-muted-foreground">Updating entry #{expenseId.slice(-6)} in the personal ledger.</p>
          </div>

          {error && (<div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">{error}</div>)}

          <div className="border border-foreground/10 bg-foreground/[0.02] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Amount ({currency})</label>
                  <div className="relative flex items-center">
                    <DollarSign className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm font-mono text-foreground"
                      placeholder="0.00" required autoFocus />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors">Currency</label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      {CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Transaction Date</label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground" required />
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Allocation</label>
                  <div className="relative flex items-center">
                    <Tag className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer" required>
                      <optgroup label="Default">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</optgroup>
                      {customCategories.length > 0 && (<optgroup label="Custom">{customCategories.map(c => <option key={c.id || c.name} value={c.name}>{c.name}</option>)}</optgroup>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Payment Channel</label>
                  <div className="relative flex items-center">
                    <ShoppingCart className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors">Account (Optional)</label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      <option value="">No account</option>
                      {accounts.map(a => (<option key={a.id} value={a.id}>{a.name} ({a.type?.replace(/_/g, ' ')})</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Memo / Description</label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground"
                    placeholder="Enter transaction details..." />
                </div>
              </div>

              {tags.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button key={tag.id} type="button" onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-medium cursor-pointer transition-all ${
                          selectedTags.includes(tag.id)
                            ? 'border-foreground/50 bg-foreground/[0.05] text-foreground'
                            : 'border-foreground/10 text-muted-foreground hover:border-foreground/30'
                        }`}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }}></span>
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6 border-t border-foreground/10">
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50">
                  {saving ? (<span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>) : (
                    <><Save className="w-[18px] h-[18px]" />Update Entry<ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
                <button type="button" onClick={() => router.push('/dashboard')}
                  className="flex-1 py-3 text-sm font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <FooterSection />
    </main>
  );
}

export default function EditExpensePage() {
  return <EditExpenseForm />;
}
