'use client';

import { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Repeat, Plus, Trash2, CreditCard, Calendar, Tag, FileText, DollarSign, Coins } from 'lucide-react';
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
        amount: parseFloat(amount), category, payment_method: paymentMethod,
        description, day_of_month: dayOfMonth, currency,
      });
      setAmount(''); setDescription('');
      loadRecurring();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add recurring expense');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/recurring/${id}/delete`);
      loadRecurring();
    } catch (err) { setError('Failed to delete recurring expense'); }
    setAmount(''); setDescription('');
  };

  const totalMonthly = recurring.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (!user) {
    return (
      <main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground">Sign in to manage recurring expenses.</p></div><FooterSection /></main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-8 h-px bg-foreground/30" />
                Subscriptions
              </span>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Recurring Commitments</h1>
              <p className="text-base text-muted-foreground">Manage subscription cycles and automated billing intervals.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2 border border-foreground/10 flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Total Monthly:</span>
                <span className="text-sm font-medium text-foreground">{currency} {totalMonthly.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {error && (<div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">{error}</div>)}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-6">
              <div className="border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
                <div className="px-6 py-4 bg-foreground/[0.02] border-b border-foreground/10 flex items-center justify-between">
                  <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Active Schedules</h3>
                  <span className="px-2 py-0.5 border border-foreground/10 text-[9px] text-muted-foreground">{recurring.length} Items</span>
                </div>

                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1,2].map(i => (<div key={i} className="animate-pulse h-16 bg-foreground/[0.03]"></div>))}
                  </div>
                ) : recurring.length > 0 ? (
                  <div className="divide-y divide-foreground/10">
                    {recurring.map((exp) => (
                      <div key={exp.id} className="p-4 flex items-center justify-between gap-4 hover:bg-foreground/[0.01] transition-colors group">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 border border-foreground/10 flex items-center justify-center text-muted-foreground shrink-0">
                            <Repeat className="w-[18px] h-[18px]" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-foreground truncate">{exp.description || exp.category}</p>
                            <p className="text-[10px] text-muted-foreground">{exp.category} &bull; {exp.payment_method}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 border border-foreground/10 text-[10px] text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" /> Day {exp.day_of_month}
                          </div>
                          <span className="text-sm font-mono text-foreground">{exp.currency || 'INR'} {exp.amount?.toFixed(2)}</span>
                          <button onClick={() => setDeleteConfirm(exp.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-16 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 border border-foreground/10 flex items-center justify-center">
                      <Repeat className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No active recurring schedules found.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="border border-foreground/10 bg-foreground/[0.02] p-8 sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 border border-foreground/10 flex items-center justify-center text-muted-foreground">
                    <Plus className="w-[18px] h-[18px]" />
                  </div>
                  <h3 className="text-sm font-medium text-foreground uppercase tracking-tight">New Loop</h3>
                </div>

                <form onSubmit={handleAdd} className="space-y-5">
                  <div className="space-y-2 group">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">
                      Monthly Amount ({currency})
                    </label>
                    <div className="relative flex items-center border-b border-foreground/10 focus-within:border-foreground/40 transition-all">
                      <DollarSign className="absolute left-0 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
                      <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)}
                        className="w-full bg-transparent border-0 py-3 pl-7 outline-none text-sm font-mono text-foreground placeholder:text-muted-foreground"
                        placeholder="0.00" required />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors">Currency</label>
                    <div className="relative flex items-center border-b border-foreground/10 focus-within:border-foreground/40 transition-all">
                      <Coins className="absolute left-0 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
                      <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-transparent border-0 py-3 pl-7 outline-none text-sm text-foreground appearance-none cursor-pointer">
                        {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Billing Day (1-28)</label>
                    <div className="relative flex items-center border-b border-foreground/10 focus-within:border-foreground/40 transition-all">
                      <Calendar className="absolute left-0 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
                      <input type="number" min="1" max="28" value={dayOfMonth} onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
                        className="w-full bg-transparent border-0 py-3 pl-7 outline-none text-sm text-foreground" required />
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Allocation</label>
                    <div className="relative flex items-center border-b border-foreground/10 focus-within:border-foreground/40 transition-all">
                      <Tag className="absolute left-0 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
                      <select value={category} onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-transparent border-0 py-3 pl-7 outline-none text-sm text-foreground appearance-none cursor-pointer" required>
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
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Payment Method</label>
                    <div className="relative flex items-center border-b border-foreground/10 focus-within:border-foreground/40 transition-all">
                      <CreditCard className="absolute left-0 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
                      <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-transparent border-0 py-3 pl-7 outline-none text-sm text-foreground appearance-none cursor-pointer">
                        <option value="Bank">Bank Transfer / UPI</option>
                        <option value="Cash">Physical Cash</option>
                        <option value="Credit Card">Credit Card</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 group">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">Schedule Name</label>
                    <div className="relative flex items-center border-b border-foreground/10 focus-within:border-foreground/40 transition-all">
                      <FileText className="absolute left-0 text-muted-foreground w-[18px] h-[18px] pointer-events-none" />
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-transparent border-0 py-3 pl-7 outline-none text-sm text-foreground placeholder:text-muted-foreground"
                        placeholder="e.g. Netflix Monthly" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button type="submit"
                      className="w-full py-3.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group cursor-pointer">
                      Initialize Schedule
                      <Plus className="w-[18px] h-[18px] transition-transform group-hover:rotate-90" />
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <ConfirmDialog
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
            title="Delete Recurring Expense"
            message="Remove this recurring schedule? This cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            variant="danger"
          />
        </div>
      </div>
      <FooterSection />
    </main>
  );
}

export default function RecurringPage() {
  return <RecurringManager />;
}
