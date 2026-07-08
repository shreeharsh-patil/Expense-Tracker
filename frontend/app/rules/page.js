'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Zap, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

function RulesManager() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newPattern, setNewPattern] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState([]);
  const [error, setError] = useState('');

  const fetchData = useCallback(() => {
    if (!user) { setRules([]); setTags([]); setLoading(false); return; }
    setLoading(true);
    Promise.all([
      api.get('/api/rules'),
      api.get('/api/tags')
    ])
      .then(([rulesRes, tagsRes]) => {
        setRules(rulesRes.data?.rules || rulesRes.data || []);
        setTags(tagsRes.data || []);
      })
      .catch(() => console.error('Failed to load data'))
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPattern.trim()) {
      setError('Rule name and pattern are required.');
      return;
    }
    setError('');
    try {
      await api.post('/rules/add', {
        name: newName.trim(),
        pattern: newPattern.trim(),
        category: newCategory,
        tag_ids: selectedTagIds
      });
      setNewName('');
      setNewPattern('');
      setNewCategory('');
      setSelectedTagIds([]);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add rule');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.post(`/rules/${id}/toggle`);
      fetchData();
    } catch (err) {
      console.error('Toggle failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this rule?')) return;
    try {
      await api.post(`/rules/${id}/delete`);
      fetchData();
    } catch (err) {
      console.error('Delete failed');
    }
  };

  const toggleTagId = (id) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to manage rules.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Smart Rules</h1>
          <p className="text-sm text-slate-500 dark:text-dark-mute">Auto-categorize expenses based on description patterns.</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="card-apple p-6 mb-8 border-white/60 dark:border-white/5">
        <form onSubmit={handleAdd} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-2">Rule Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2 outline-none focus:border-primary text-sm text-slate-900 dark:text-white"
                placeholder="e.g. Zomato Orders" required />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-2">Pattern (regex)</label>
              <input type="text" value={newPattern} onChange={(e) => setNewPattern(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2 outline-none focus:border-primary text-sm text-slate-900 dark:text-white font-mono"
                placeholder="zomato|swiggy" required />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-2">Auto-Category</label>
              <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2 outline-none focus:border-primary text-sm text-slate-800 dark:text-white cursor-pointer">
                <option value="">Don&apos;t change</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          {tags.length > 0 && (
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest mb-2">Auto-Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <label key={tag.id} onClick={() => toggleTagId(tag.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold cursor-pointer transition-all ${
                      selectedTagIds.includes(tag.id)
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-slate-200 dark:border-white/10 text-slate-500 dark:text-dark-mute hover:border-primary/50'
                    }`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tag.color }}></span>
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <button type="submit" className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </form>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1,2].map(i => (
            <div key={i} className="card-apple p-4 animate-pulse">
              <div className="h-4 bg-slate-200 dark:bg-dark-border rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : rules.length > 0 ? (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="card-apple p-4 flex items-center justify-between border-white/60 dark:border-white/5">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{rule.name}</span>
                  {rule.category && (
                    <span className="tag-badge tag-other text-[9px]">{rule.category}</span>
                  )}
                  {!rule.is_active && (
                    <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Paused</span>
                  )}
                </div>
                <code className="text-[10px] font-mono text-slate-500 dark:text-dark-mute mt-1 block">{rule.pattern}</code>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(rule.id)}
                  className={`px-3 py-1 text-[9px] font-bold rounded-lg cursor-pointer transition-all ${
                    rule.is_active
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400'
                  }`}>
                  {rule.is_active ? 'Active' : 'Paused'}
                </button>
                <button onClick={() => handleDelete(rule.id)} className="text-slate-300 hover:text-accent-red transition-colors cursor-pointer p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card-apple p-12 text-center border-white/60 dark:border-white/5">
          <Zap className="w-12 h-12 text-slate-300 dark:text-dark-border mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Rules Yet</h3>
          <p className="text-sm text-slate-500 dark:text-dark-mute max-w-xs mx-auto">
            Create rules like &quot;if description contains &apos;zomato&apos;, set category to Food&quot; to auto-categorize expenses as you add them.
          </p>
        </div>
      )}
    </div>
  );
}

export default function RulesPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <RulesManager />
        </main>
        <Footer />
      </div>
  );
}
