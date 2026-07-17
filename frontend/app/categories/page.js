'use client';

import { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Tags, Plus, Edit3, Trash2, Save } from 'lucide-react';
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

function EditForm({ cat, onCancel, onEdit }) {
  const [name, setName] = useState(cat.name);
  const [icon, setIcon] = useState(cat.icon || 'category');
  const [color, setColor] = useState(cat.color || '#6366f1');

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onEdit(cat.id, { name: name.trim(), icon, color }); }}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex-1 min-w-[160px]">
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border border-foreground/10 px-4 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-all" required />
      </div>
      <div className="w-24">
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Icon</label>
        <select value={icon} onChange={(e) => setIcon(e.target.value)}
          className="w-full bg-transparent border border-foreground/10 px-3 py-2 text-sm text-foreground outline-none focus:border-foreground/40 transition-all appearance-none cursor-pointer">
          {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="w-20">
        <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Color</label>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
          className="w-full h-[38px] border border-foreground/10 cursor-pointer bg-transparent" />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 text-[11px] font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer">
          <Save className="w-3.5 h-3.5 inline-block mr-1" />Save
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-all cursor-pointer">
          Cancel
        </button>
      </div>
    </form>
  );
}

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

  useEffect(() => { loadCategories(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || newName.trim().length < 2) {
      setError('Category name must be at least 2 characters.');
      return;
    }
    setError('');
    try {
      await api.post('/api/categories', { name: newName.trim(), icon: newIcon, color: newColor });
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
      await api.put(`/api/categories/${id}`, data);
      setEditId(null);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update category');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/categories/${id}`);
      loadCategories();
    } catch (err) {
      setError('Failed to delete category');
    }
  };

  if (!user) {
    return (
      <main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center py-20"><p className="text-sm text-muted-foreground">Sign in to manage categories.</p></div><FooterSection /></main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-8 h-px bg-foreground/30" />
                Organization
              </span>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Custom Categories</h1>
              <p className="text-base text-muted-foreground">Create and manage your own expense categories beyond the defaults.</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">
              {error}
            </div>
          )}

          <div className="border border-foreground/10 bg-foreground/[0.02] p-6 mb-8">
            <h3 className="text-xs font-medium text-foreground uppercase tracking-widest mb-4">Create New Category</h3>
            <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Name</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-transparent border-b border-foreground/10 px-4 py-2.5 text-sm text-foreground outline-none focus:border-foreground/40 transition-all"
                  placeholder="e.g. Freelance" required />
              </div>
              <div className="w-24">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Icon</label>
                <select value={newIcon} onChange={(e) => setNewIcon(e.target.value)}
                  className="w-full bg-transparent border-b border-foreground/10 px-3 py-2.5 text-sm text-foreground outline-none focus:border-foreground/40 appearance-none cursor-pointer">
                  {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="w-20">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-1">Color</label>
                <input type="color" value={newColor} onChange={(e) => setNewColor(e.target.value)}
                  className="w-full h-[42px] border border-foreground/10 cursor-pointer bg-transparent" />
              </div>
              <button type="submit" className="px-6 py-2.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Category
              </button>
            </form>
          </div>

          <div className="border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
            {categories.length > 0 ? (
              <div className="divide-y divide-foreground/10">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <div className="p-4 flex items-center justify-between gap-4 hover:bg-foreground/[0.01] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}15`, color: cat.color }}>
                          <Tags className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{cat.name}</p>
                          <p className="text-[10px] text-muted-foreground">{cat.usage_count || 0} expense{(cat.usage_count || 0) !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setEditId(editId === cat.id ? null : cat.id)} className="p-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer" title="Edit">
                          <Edit3 className="w-[18px] h-[18px]" />
                        </button>
                        <button onClick={() => setDeleteConfirm(cat.id)} className="p-2 text-muted-foreground hover:text-foreground transition-all cursor-pointer" title="Delete">
                          <Trash2 className="w-[18px] h-[18px]" />
                        </button>
                      </div>
                    </div>
                    {editId === cat.id && (
                      <div className="px-4 pb-4 pt-0 bg-foreground/[0.01]">
                        <EditForm cat={cat} onCancel={() => setEditId(null)} onEdit={handleEdit} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Tags className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">No Custom Categories</p>
                <p className="text-[10px] mt-2 max-w-[240px] mx-auto text-muted-foreground">Create your own categories above for better organization.</p>
              </div>
            )}
          </div>

          <div className="border border-foreground/10 bg-foreground/[0.02] p-6 mt-8">
            <h3 className="text-xs font-medium text-foreground uppercase tracking-widest mb-4">Default Categories</h3>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
                <span key={cat} className="px-3 py-1.5 text-[10px] text-muted-foreground border border-foreground/10">
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">Default categories are always available. Custom categories appear alongside them in expense forms.</p>
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
        </div>
      </div>
      <FooterSection />
    </main>
  );
}

export default function CategoriesPage() {
  return <CategoriesManager />;
}
