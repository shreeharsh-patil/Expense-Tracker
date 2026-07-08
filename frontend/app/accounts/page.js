'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Plus, Edit3, Trash2, X, Wallet, CreditCard, Banknote, TrendingUp, PiggyBank } from 'lucide-react';

const ACCOUNT_TYPES = ['bank', 'cash', 'credit_card', 'investment', 'wallet', 'other'];
const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'];

const typeIcons = {
  bank: Wallet,
  cash: Banknote,
  credit_card: CreditCard,
  investment: TrendingUp,
  wallet: PiggyBank,
  other: Wallet,
};

const typeColors = {
  bank: 'bg-blue-500/10 text-blue-500',
  cash: 'bg-emerald-500/10 text-emerald-500',
  credit_card: 'bg-red-500/10 text-red-500',
  investment: 'bg-purple-500/10 text-purple-500',
  wallet: 'bg-amber-500/10 text-amber-500',
  other: 'bg-slate-100 dark:bg-white/5 text-slate-400',
};

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="card-apple p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors flex items-center justify-center cursor-pointer">
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

  useEffect(() => {
    if (!user) return;
    api.get('/api/accounts')
      .then(res => setAccounts(res.data || []))
      .catch(() => console.error('Failed to load accounts'))
      .finally(() => setLoading(false));
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    try {
      await api.post('/accounts/add', Object.fromEntries(data));
      setShowAddModal(false);
      api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add account');
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;
    const data = new FormData(e.target);
    try {
      await api.post(`/accounts/${editingAccount.id}/edit`, {
        name: data.get('name'),
        type: data.get('type'),
        currency: data.get('currency'),
        is_active: data.get('is_active') === '1',
      });
      setShowEditModal(false);
      setEditingAccount(null);
      api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => {});
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update account');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete account "${name}"? Transactions linked to it will be unlinked.`)) return;
    try {
      await api.post(`/accounts/${id}/delete`);
      api.get('/api/accounts').then(res => setAccounts(res.data || [])).catch(() => {});
    } catch (err) {
      console.error('Delete failed');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to manage accounts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Wallet Manager</span>
          </div>
          <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Accounts</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Manage your bank accounts, cash wallets, and credit instruments.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="btn-primary px-5 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2 cursor-pointer">
          <Plus className="w-4 h-4" />
          New Account
        </button>
      </section>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="card-apple p-5 md:p-6 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-2/3 mb-4"></div>
              <div className="h-8 bg-slate-200 dark:bg-dark-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {accounts.map((acc) => {
            const Icon = typeIcons[acc.type] || Wallet;
            return (
              <div key={acc.id} className={`card-apple p-5 md:p-6 hover-lift flex flex-col border-white/60 dark:border-white/5 ${!acc.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${typeColors[acc.type] || typeColors.other} flex items-center justify-center`}>
                      <Icon className="w-[22px] h-[22px]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{acc.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-dark-mute uppercase tracking-widest font-bold">{acc.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button onClick={() => { setEditingAccount(acc); setShowEditModal(true); }} className="text-slate-300 hover:text-primary transition-colors p-1 cursor-pointer">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-dark-border/40">
                  <p className="text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-1">Calculated Balance</p>
                  <p className={`text-2xl font-mono font-bold ${(acc.calculated_balance || 0) >= 0 ? 'text-slate-900 dark:text-white' : 'text-accent-red'}`}>
                    {(acc.calculated_balance || 0) >= 0 ? '' : '-'}{(acc.currency || 'INR')} {Math.abs(acc.calculated_balance || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card-apple p-16 text-center border-white/60 dark:border-white/5">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-dark-border" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Accounts Yet</h3>
          <p className="text-sm text-slate-500 dark:text-dark-mute max-w-sm mx-auto mb-8">
            Create an account to start tracking your balances across bank accounts, cash, credit cards, and more.
          </p>
          <button onClick={() => setShowAddModal(true)} className="btn-primary px-8 py-3 text-sm font-bold shadow-lg shadow-primary/20 inline-flex items-center gap-2 cursor-pointer">
            <Plus className="w-[18px] h-[18px]" />
            Create Your First Account
          </button>
        </div>
      )}

      {/* Add Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="New Account">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Account Name</label>
            <input type="text" name="name" className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary transition-all text-sm text-slate-900 dark:text-white" placeholder="e.g. HDFC Savings" required />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Type</label>
            <select name="type" className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary transition-all text-sm text-slate-800 dark:text-white appearance-none cursor-pointer">
              {ACCOUNT_TYPES.map(t => (
                <option key={t} value={t}>{t.replace('_', ' ')}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Currency</label>
            <select name="currency" className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary transition-all text-sm text-slate-800 dark:text-white appearance-none cursor-pointer">
              {CURRENCIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1 py-3 text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer">Create Account</button>
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary flex-1 py-3 text-xs font-bold cursor-pointer">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => { setShowEditModal(false); setEditingAccount(null); }} title="Edit Account">
        {editingAccount && (
          <>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Account Name</label>
                <input type="text" name="name" defaultValue={editingAccount.name}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary transition-all text-sm text-slate-900 dark:text-white" required />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Type</label>
                <select name="type" defaultValue={editingAccount.type}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary transition-all text-sm text-slate-800 dark:text-white appearance-none cursor-pointer">
                  {ACCOUNT_TYPES.map(t => (
                    <option key={t} value={t}>{t.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Currency</label>
                <select name="currency" defaultValue={editingAccount.currency}
                  className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary transition-all text-sm text-slate-800 dark:text-white appearance-none cursor-pointer">
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_active" value="1" defaultChecked={editingAccount.is_active}
                  className="rounded border-slate-300 dark:border-dark-border" id="edit_acc_active" />
                <label htmlFor="edit_acc_active" className="text-xs text-slate-600 dark:text-dark-mute">Account is active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1 py-3 text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer">Save Changes</button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingAccount(null); }} className="btn-secondary flex-1 py-3 text-xs font-bold cursor-pointer">Cancel</button>
              </div>
            </form>
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-border/40">
              <button onClick={() => { handleDelete(editingAccount.id, editingAccount.name); setShowEditModal(false); }}
                className="w-full text-xs font-bold text-accent-red hover:text-red-600 transition-colors py-2 cursor-pointer">
                Delete Account
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}

export default function AccountsPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <AccountsManager />
        </main>
        <Footer />
      </div>
  );
}
