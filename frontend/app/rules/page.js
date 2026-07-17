'use client';

import { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Zap, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

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
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadData() {
    if (!user) { setRules([]); setTags([]); setLoading(false); return; }
    setLoading(true);
    try {
      const [rulesRes, tagsRes] = await Promise.all([
        api.get('/api/rules'),
        api.get('/api/tags')
      ]);
      setRules(rulesRes.data?.rules || rulesRes.data || []);
      setTags(tagsRes.data || []);
    } catch {
      setError('Failed to load rules');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPattern.trim()) {
      setError('Rule name and pattern are required.');
      return;
    }
    setError('');
    try {
      await api.post('/api/rules', {
        name: newName.trim(),
        pattern: newPattern.trim(),
        category: newCategory,
        tag_ids: selectedTagIds
      });
      setNewName('');
      setNewPattern('');
      setNewCategory('');
      setSelectedTagIds([]);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add rule');
    }
  };

  const handleToggle = async (id) => {
    try {
      await api.post(`/api/rules/${id}/toggle`);
      loadData();
    } catch (err) {
      setError('Failed to toggle rule');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/rules/${id}`);
      loadData();
    } catch (err) {
      setError('Failed to delete rule');
    }
  };

  const toggleTagId = (id) => {
    setSelectedTagIds(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  if (!user) {
    return (
      <main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center py-20"><p className="text-sm text-muted-foreground">Sign in to manage rules.</p></div><FooterSection /></main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Automation
            </span>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">
              Smart Rules
            </h1>
            <p className="text-base text-muted-foreground">Auto-categorize expenses based on description patterns.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">
              {error}
            </div>
          )}

          <div className="border border-foreground/10 bg-foreground/[0.02] p-6 mb-8">
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Rule Name</label>
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2 outline-none focus:border-foreground/40 text-sm text-foreground"
                    placeholder="e.g. Zomato Orders" required />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Pattern (regex)</label>
                  <input type="text" value={newPattern} onChange={(e) => setNewPattern(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2 outline-none focus:border-foreground/40 text-sm text-foreground font-mono"
                    placeholder="zomato|swiggy" required />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Auto-Category</label>
                  <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-transparent border-b border-foreground/10 py-2 outline-none focus:border-foreground/40 text-sm text-foreground cursor-pointer">
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
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Auto-Tags</label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button key={tag.id} type="button" onClick={() => toggleTagId(tag.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 border text-[10px] font-medium cursor-pointer transition-all ${
                          selectedTagIds.includes(tag.id)
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
              <button type="submit" className="px-5 py-2 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Rule
              </button>
            </form>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2].map(i => (
                <div key={i} className="border border-foreground/10 p-4 animate-pulse">
                  <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-foreground/10 bg-foreground/[0.02] p-4 flex items-center justify-between hover:border-foreground/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground">{rule.name}</span>
                      {rule.category && (
                        <span className="text-[10px] font-mono text-muted-foreground border border-foreground/10 px-2 py-0.5">{rule.category}</span>
                      )}
                      {!rule.is_active && (
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Paused</span>
                      )}
                    </div>
                    <code className="text-[10px] font-mono text-muted-foreground mt-1 block">{rule.pattern}</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggle(rule.id)}
                      className={`px-3 py-1 text-[9px] font-medium cursor-pointer transition-all ${
                        rule.is_active
                          ? 'bg-foreground/[0.08] text-foreground'
                          : 'bg-foreground/[0.03] text-muted-foreground'
                      }`}>
                      {rule.is_active ? 'Active' : 'Paused'}
                    </button>
                    <button onClick={() => setDeleteConfirm(rule.id)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-foreground/10 bg-foreground/[0.02] p-12 text-center">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-display mb-2">No Rules Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                Create rules like &quot;if description contains &apos;zomato&apos;, set category to Food&quot; to auto-categorize expenses.
              </p>
            </div>
          )}

          <ConfirmDialog
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => {
              if (deleteConfirm) handleDelete(deleteConfirm);
              setDeleteConfirm(null);
            }}
            title="Delete Rule"
            message={`Delete rule "${rules.find(r => r.id === deleteConfirm)?.name || ''}"? This cannot be undone.`}
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

export default function RulesPage() {
  return <RulesManager />;
}
