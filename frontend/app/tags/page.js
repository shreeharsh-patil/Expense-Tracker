'use client';

import { useState, useEffect } from 'react';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { Tag, Plus, Trash2 } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';

function TagsManager() {
  const { user } = useAuth();
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadTags() {
    if (!user) { setTags([]); setLoading(false); return; }
    setLoading(true);
    try {
      const res = await api.get('/api/tags');
      setTags(res.data);
    } catch {
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTags(); }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setError('');
    try {
      await api.post('/tags/add', { name: newName.trim(), color: newColor });
      setNewName('');
      setNewColor('#6366f1');
      loadTags();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add tag');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.post(`/tags/${id}/delete`);
      loadTags();
    } catch (err) {
      setError('Failed to delete tag');
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-muted-foreground">Sign in to manage tags.</p>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Labels
            </span>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">
              Tags
            </h1>
            <p className="text-base text-muted-foreground">Organize expenses with custom tags and labels.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">
              {error}
            </div>
          )}

          <div className="border border-foreground/10 bg-foreground/[0.02] p-6 mb-8">
            <form onSubmit={handleAdd} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">New Tag</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-transparent border-b border-foreground/10 py-2.5 outline-none focus:border-foreground/40 text-sm text-foreground"
                  placeholder="e.g. 'Tax Deductible'"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">Color</label>
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-10 h-10 border border-foreground/10 cursor-pointer bg-transparent"
                />
              </div>
              <button type="submit" className="px-5 py-2.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" />
                Add Tag
              </button>
            </form>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => (
                <div key={i} className="border border-foreground/10 p-4 animate-pulse">
                  <div className="h-4 bg-foreground/10 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : tags.length > 0 ? (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id} className="border border-foreground/10 bg-foreground/[0.02] p-4 flex items-center justify-between hover:border-foreground/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: tag.color }}></span>
                    <span className="text-sm text-foreground">{tag.name}</span>
                    <span className="text-[10px] text-muted-foreground">({tag.usage_count || 0} expenses)</span>
                  </div>
                  <button onClick={() => setDeleteConfirm(tag.id)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-foreground/10 bg-foreground/[0.02] p-12 text-center">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-display mb-2">No Tags Yet</h3>
              <p className="text-sm text-muted-foreground">Create tags to organize your expenses (e.g., &quot;Tax Deductible&quot;, &quot;Business&quot;, &quot;Gift&quot;).</p>
            </div>
          )}

          <ConfirmDialog
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => {
              if (deleteConfirm) handleDelete(deleteConfirm);
              setDeleteConfirm(null);
            }}
            title="Delete Tag"
            message={`Delete tag "${tags.find(t => t.id === deleteConfirm)?.name || ''}"? This cannot be undone.`}
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

export default function TagsPage() {
  return <TagsManager />;
}
