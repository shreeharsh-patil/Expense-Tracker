'use client';

import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Tags, Plus, Edit3, Trash2, X, Save } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

const ICON_OPTIONS = [
  { value: 'category', label: 'Default' },
  { value: 'work', label: 'Work' },
  { value: 'school', label: 'School' },
  { value: 'home', label: 'Home' },
  { value: 'pets', label: 'Pets' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'flight', label: 'Travel' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'gift', label: 'Gifts' },
];

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Other'];

function CategoriesManager() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('category');
  const [newColor, setNewColor] = useState('#6366f1');
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadCategories() {
    if (!user) { setCategories([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data || []);
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { loadCategories(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim().length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }
    setError('');
    try {
      await api.post('/categories/add', { name: newName.trim(), icon: newIcon, color: newColor });
      setNewName('');
      setNewIcon('category');
      setNewColor('#6366f1');
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleEdit = async (id, data) => {
    try {
      await api.post(`/categories/${id}/edit`, data);
      setEditId(null);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/categories/${id}/delete`);
      loadCategories();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to manage categories.</p>
      </div>
    );
  }

  const EditForm = ({ cat, onCancel }) => {
    const [name, setName] = useState(cat.name);
    const [icon, setIcon] = useState(cat.icon || 'category');
    const [color, setColor] = useState(cat.color || '#6366f1');

    return (
      <form
        onSubmit={(e) => { e.preventDefault(); handleEdit(cat.id, { name: name.trim(), icon, color }); }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="flex-1 min-w-[160px]">
          <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all" required />
        </div>
        <div className="w-24">
          <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Icon</label>
          <select value={icon} onChange={(e) => setIcon(e.target.value)}
            className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer">
            {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="w-20">
          <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-full h-[38px] rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer bg-white dark:bg-white/5" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 text-[11px] font-bold bg-primary text-white rounded-xl hover:brightness-110 transition-all cursor-pointer">
            <Save className="w-3.5 h-3.5 inline-block mr-1" />Save
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-dark-mute dark:hover:text-white transition-all cursor-pointer">
            Cancel
          </button>
        </div>
      </form>
    );
  };

  return (
    <section className="px-4 sm:px-6 py-12 max-w-4xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Tags className="w-[22px] h-[22px]" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Custom Categories</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-dark-mute">Create and manage your own expense categories beyond the defaults.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="card-apple p-6 mb-8 border-white/60 dark:border-white/5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4">Create New Category</h3>
        <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all"
              placeholder="e.g. Freelance" required />
          </div>
          <div className="w-24">
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Icon</label>
            <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-primary transition-all appearance-none cursor-pointer">
              {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="w-20">
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-1">Color</label>
            <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
              className="w-full h-[42px] rounded-xl border border-slate-200 dark:border-white/10 cursor-pointer bg-slate-50 dark:bg-white/5" />
          </div>
          <button type="submit" className="btn-primary px-6 py-2.5 text-xs font-bold !rounded-xl flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </form>
      </div>

      <div className="card-apple overflow-hidden border-white/60 dark:border-white/5">
        {categories.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-dark-border/10">
            {categories.map((cat) => (
              <React.Fragment key={cat.id}>
                <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                      <Tags className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{cat.name}</p>
                      <p className="text-[10px] text-slate-500 dark:text-dark-mute">{cat.usage_count || 0} expense{(cat.usage_count || 0) !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditId(editId === cat.id ? null : cat.id)} className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-primary/10 transition-all cursor-pointer" title="Edit">
                      <Edit3 className="w-[18px] h-[18px]" />
                    </button>
                    <button onClick={() => setDeleteConfirm(cat.id)} className="p-2 rounded-lg text-slate-500 hover:text-accent-red hover:bg-accent-red/10 transition-all cursor-pointer" title="Delete">
                      <Trash2 className="w-[18px] h-[18px]" />
                    </button>
                  </div>
                </div>
                {editId === cat.id && (
                  <div className="px-4 pb-4 pt-0 bg-slate-50/50 dark:bg-white/[0.01]">
                    <EditForm cat={cat} onCancel={() => setEditId(null)} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <Tags className="w-12 h-12 text-slate-400 dark:text-dark-border mx-auto mb-4" />
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">No Custom Categories</p>
            <p className="text-[10px] mt-2 max-w-[240px] mx-auto text-slate-500">Create your own categories above for better organization.</p>
          </div>
        )}
      </div>

      <div className="card-apple p-6 mt-8 border-white/60 dark:border-white/5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest mb-4">Default Categories</h3>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((cat) => (
            <span key={cat} className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-[10px] font-bold text-slate-500 dark:text-dark-mute border border-slate-200 dark:border-white/10">
              {cat}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-dark-mute mt-4">Default categories are always available. Custom categories appear alongside them in expense forms.</p>
      </div>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) handleDelete(deleteConfirm);
          setDeleteConfirm(null);
        }}
        title="Delete Category"
        message="Delete this category? Expenses will be reassigned to Other."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </section>
  );
}

export default function CategoriesPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <CategoriesManager />
        </main>
        <Footer />
      </div>
  );
}
