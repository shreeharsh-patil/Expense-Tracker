'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, api } from '../../../components/AuthContext';
import { Navigation } from '../../../components/landing/navigation';
import { FooterSection } from '../../../components/landing/footer-section';
import { ArrowRight, DollarSign, Tag, FileText, Calendar, CreditCard, TrendingUp } from 'lucide-react';

const INCOME_SOURCES = ['Salary', 'Freelance', 'Business', 'Investments', 'Rent', 'Refund', 'Gift', 'Other'];

function AddIncomeForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('Salary');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [currency, setCurrency] = useState('INR');
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      api.get('/api/accounts').then(res => { setAccounts(res.data?.filter(a => a.is_active !== false) || []); }).catch(() => {});
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!amount || parseFloat(amount) <= 0) { setError('Please enter a valid amount.'); return; }
    setLoading(true);
    try {
      await api.post('/api/income', { amount: parseFloat(amount), source, description, date, currency, account_id: accountId || null });
      router.push('/dashboard');
    } catch (err) { setError(err.response?.data?.error || 'Failed to add income.'); }
    finally { setLoading(false); }
  };

  if (!user) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground">Sign in to record income.</p></div><FooterSection /></main>);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />Capital Inflow
            </span>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Record Income</h1>
            <p className="text-base text-muted-foreground">Log a new income entry to your financial ledger.</p>
          </div>

          {error && (<div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">{error}</div>)}

          <div className="border border-foreground/10 bg-foreground/[0.02] p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Amount ({currency})</label>
                <div className="relative flex items-center">
                  <DollarSign className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                  <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm font-mono text-foreground"
                    placeholder="0.00" required />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors">Currency</label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Source</label>
                  <div className="relative flex items-center">
                    <TrendingUp className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={source} onChange={(e) => setSource(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer" required>
                      {INCOME_SOURCES.map(s => (<option key={s} value={s}>{s}</option>))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Date</label>
                <div className="relative flex items-center">
                  <Calendar className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground" required />
                </div>
              </div>

              <div className="space-y-2 group">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Description (Optional)</label>
                <div className="relative flex items-center">
                  <FileText className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground"
                    placeholder="e.g. June salary payment" />
                </div>
              </div>

              {accounts.length > 0 && (
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors">Account (Optional)</label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select value={accountId} onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      <option value="">No account</option>
                      {accounts.map(a => (<option key={a.id} value={a.id}>{a.name}</option>))}
                    </select>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer">
                  {loading ? (<span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>) : (
                    <>Record Income<ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" /></>
                  )}
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

export default function AddIncomePage() {
  return <AddIncomeForm />;
}
