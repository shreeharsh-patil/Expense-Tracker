'use client';

import { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Plus, Edit3, Trash2, X, Wallet, CreditCard, Banknote, TrendingUp, PiggyBank } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'investment', 'wallet', 'other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];

const typeIcons = { bank: Wallet, cash: Banknote, credit_card: CreditCard, investment: TrendingUp, wallet: PiggyBank, other: Wallet };

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="border border-foreground/10 bg-background p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-display text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AccountsManager() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!user) return;
    api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => setError('Failed to load accounts')).finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await api.post('/accounts/add', Object.fromEntries(data));
      setShowAddModal(false);
      api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => {});
    } catch (err) { setError(err.response?.data?.error || 'Failed to add account'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    const data = new FormData(e.target);
    try {
      await api.post(`/accounts/${editingAccount.id}/edit`, { name: data.get('name'), type: data.get('type'), currency: data.get('currency'), is_active: data.get('is_active') === '1' });
      setShowEditModal(false); setEditingAccount(null);
      api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => {});
    } catch (err) { setError(err.response?.data?.error || 'Failed to update account'); }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/accounts/${id}/delete`);
      api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => {});
    } catch (err) { setError('Failed to delete account'); }
  };

  if (!user) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground">Sign in to manage accounts.</p></div><FooterSection /></main>);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-8 h-px bg-foreground/30" />Wallet Manager
              </span>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Accounts</h1>
              <p className="text-base text-muted-foreground">Manage your bank accounts, cash wallets, and credit instruments.</p>
            </div>
            <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center gap-2 cursor-pointer">
              <Plus className="w-4 h-4" />New Account
            </button>
          </div>

          {error && (<div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">{error}</div>)}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1,2,3].map(i => (<div key={i} className="border border-foreground/10 p-6 animate-pulse"><div className="h-4 bg-foreground/10 rounded w-2/3 mb-4"></div><div className="h-8 bg-foreground/10 rounded w-1/2"></div></div>))}
            </div>
          ) : accounts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {accounts.map((acc) => {
                const Icon = typeIcons[acc.type] || Wallet;
                return (
                  <div key={acc.id} className={`border border-foreground/10 bg-foreground/[0.02] p-6 flex flex-col hover:border-foreground/30 transition-all ${!acc.is_active ? 'opacity-50' : ''}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-foreground/10 flex items-center justify-center text-foreground/60">
                          <Icon className="w-[22px] h-[22px]" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground">{acc.name}</p>
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{acc.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <button onClick={() => { setEditingAccount(acc); setShowEditModal(true); }} className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-auto pt-4 border-t border-foreground/10">
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Calculated Balance</p>
                      <p className={`text-2xl font-mono ${(acc.calculated_balance || 0) >= 0 ? 'text-foreground' : 'text-red-500'}`}>
                        {(acc.calculated_balance || 0) >= 0 ? '' : '-'}{(acc.currency || 'INR')} {Math.abs(acc.calculated_balance || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border border-foreground/10 bg-foreground/[0.02] p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 border border-dashed border-foreground/10 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-display mb-2">No Accounts Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">Create an account to start tracking your balances across bank accounts, cash, credit cards, and more.</p>
              <button onClick={() => setShowAddModal(true)} className="px-8 py-3 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all inline-flex items-center gap-2 cursor-pointer">
                <Plus className="w-[18px] h-[18px]" />Create Your First Account
              </button>
            </div>
          )}

          <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="New Account">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Account Name</label>
                <input type="text" name="name" className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 transition-all text-sm text-foreground" placeholder="e.g. HDFC Savings" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Type</label>
                <select name="type" className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                  {ACCOUNT_TYPES.map(t => (<option key={t} value={t}>{t.replace('_', ' ')}</option>))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Currency</label>
                <select name="currency" className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                  {CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-3 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer">Create Account</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-xs font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all cursor-pointer">Cancel</button>
              </div>
            </form>
          </Modal>

          <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingAccount(null); }} title="Edit Account">
            {editingAccount && (
              <>
                <form onSubmit={handleEdit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Account Name</label>
                    <input type="text" name="name" defaultValue={editingAccount.name}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 transition-all text-sm text-foreground" required />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Type</label>
                    <select name="type" defaultValue={editingAccount.type}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      {ACCOUNT_TYPES.map(t => (<option key={t} value={t}>{t.replace('_', ' ')}</option>))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Currency</label>
                    <select name="currency" defaultValue={editingAccount.currency}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      {CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" name="is_active" value="1" defaultChecked={editingAccount.is_active}
                      className="border-foreground/10" id="edit_acc_active" />
                    <label htmlFor="edit_acc_active" className="text-xs text-muted-foreground">Account is active</label>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button type="submit" className="flex-1 py-3 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer">Save Changes</button>
                    <button type="button" onClick={() => { setShowEditModal(false); setEditingAccount(null); }} className="flex-1 py-3 text-xs font-medium border border-foreground/20 hover:border-foreground/40 rounded-full transition-all cursor-pointer">Cancel</button>
                  </div>
                </form>
                <div className="mt-4 pt-4 border-t border-foreground/10">
                  <button onClick={() => { setDeleteConfirm({ id: editingAccount.id, name: editingAccount.name }); setShowEditModal(false); }}
                    className="w-full text-xs font-medium text-red-500 hover:text-red-400 transition-colors py-2 cursor-pointer">Delete Account</button>
                </div>
              </>
            )}
          </Modal>

          <ConfirmDialog
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm.id); setDeleteConfirm(null); }}
            title="Delete Account"
            message={`Delete account "${deleteConfirm?.name || ''}"? Transactions linked to it will be unlinked.`}
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

export default function AccountsPage() {
  return <AccountsManager />;
}
