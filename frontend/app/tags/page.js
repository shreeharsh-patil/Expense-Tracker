'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Tag, Plus, Trash2, Palette } from 'lucide-react';

function TagsManager() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [error, setError] = useState('');

  const fetchTags = useCallback(() => {
    if (!user) { setTags([]); setLoading(false); return; }
    setLoading(true);
    api.get('/api/tags')
      .then(res => setTags(res.data))
      .catch(() => console.error('Failed to load tags'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      const res = await api.post('/tags/add', { name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor('#6366f1');
      fetchTags();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add tag');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this tag?')) return;
    try {
      await api.post(`/tags/${id}/delete`);
      fetchTags();
    } catch (err) {
      console.error('Delete failed');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to manage tags.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Tags</h1>
          <p className="text-sm text-slate-500 dark:text-dark-mute">Organize expenses with custom tags and labels.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="card-apple p-6 mb-8 border-white/60 dark:border-white/5">
        <form onSubmit={handleAdd} className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-2">New Tag</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 outline-none focus:border-primary text-sm text-slate-900 dark:text-white"
              placeholder="e.g. 'Tax Deductible'"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest mb-2">Color</label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-slate-200 dark:border-dark-border cursor-pointer"
            />
          </div>
          <button type="submit" className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="card-apple p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : tags.length > 0 ? (
        <div className="space-y-2">
          {tags.map((tag) => (
            <div key={tag.id} className="card-apple p-4 flex items-center justify-between border-white/60 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{tag.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-dark-mute">({tag.usage_count || 0} expenses)</span>
              </div>
              <button onClick={() => handleDelete(tag.id)} className="text-slate-400 hover:text-accent-red transition-colors cursor-pointer p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-apple p-12 text-center border-white/60 dark:border-white/5">
          <Tag className="w-12 h-12 text-slate-400 dark:text-dark-border mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Tags Yet</h3>
          <p className="text-sm text-slate-500 dark:text-dark-mute">Create tags to organize your expenses (e.g., &quot;Tax Deductible&quot;, &quot;Business&quot;, &quot;Gift&quot;).</p>
        </div>
      )}
    </div>
  );
}

export default function TagsPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <TagsManager />
        </main>
        <Footer />
      </div>
  );
}
