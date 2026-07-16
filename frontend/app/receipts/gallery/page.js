'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../../components/AuthContext';
import { Navigation } from '../../../components/landing/navigation';
import { FooterSection } from '../../../components/landing/footer-section';
import { Camera, Upload, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import ConfirmDialog from '../../../components/ConfirmDialog';

function ReceiptGallery() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [failedImages, setFailedImages] = useState({});

  const fetchReceipts = useCallback((p = 1) => {
    setLoading(true);
    api.get(`/api/receipts?page=${p}`)
      .then(res => {
        setReceipts(res.data?.receipts || []);
        setTotalPages(res.data?.total_pages || 1);
        setTotalReceipts(res.data?.total_receipts || 0);
        setPage(res.data?.page || 1);
      })
      .catch(() => setError('Failed to load receipts'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { if (!user) return; fetchReceipts(); }, [user, fetchReceipts]);

  const handleDelete = async (id) => {
    try { await api.post(`/receipts/${id}/delete`); fetchReceipts(page); }
    catch (err) { setError('Failed to delete receipt'); }
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    return `${apiUrl}/uploads/receipts/${filename}`;
  };

  if (!user) {
    return (<main className="bg-background min-h-screen"><Navigation /><div className="pt-32 max-w-2xl mx-auto text-center"><p className="text-sm text-muted-foreground">Sign in to view receipts.</p></div><FooterSection /></main>);
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-8 h-px bg-foreground/30" />Document Archive
              </span>
              <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Receipt Gallery</h1>
              <p className="text-base text-muted-foreground">Browse all your digitized vouchers and scanned receipts.</p>
            </div>
            <Link href="/receipt/scan" className="px-5 py-2.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center gap-2">
              <Upload className="w-4 h-4" />Upload New
            </Link>
          </div>

          {error && (<div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium">{error}</div>)}

          {loading ? (
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="border border-foreground/10 overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-foreground/10"></div>
                  <div className="p-4 space-y-2"><div className="h-3 bg-foreground/10 rounded w-2/3"></div><div className="h-3 bg-foreground/10 rounded w-1/3"></div></div>
                </div>
              ))}
            </div>
          ) : receipts.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {receipts.map((r) => {
                  const imageUrl = getImageUrl(r.filename);
                  return (
                    <div key={r.id} className="border border-foreground/10 bg-foreground/[0.02] overflow-hidden group flex flex-col hover:border-foreground/30 transition-all">
                      <div className="relative aspect-[3/4] bg-foreground/[0.03] overflow-hidden">
                        {imageUrl && !failedImages[r.id] ? (
                          <img src={imageUrl} alt={r.original_name || 'Receipt'}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                            onError={() => { setFailedImages(prev => ({ ...prev, [r.id]: true })); }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                            </svg>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                          <span className={`text-[9px] text-background px-2 py-1 font-mono uppercase tracking-widest ${r.expense_id ? 'bg-foreground/80' : 'bg-foreground/50'}`}>
                            {r.expense_id ? 'Linked' : 'Unlinked'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <p className="text-xs text-foreground truncate" title={r.original_name}>
                          {r.original_name?.length > 28 ? r.original_name.substring(0, 25) + '...' : r.original_name}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                          <span>{r.created_at?.substring(0, 10) || ''}</span>
                          {r.amount && (<span className="font-mono">{r.currency || 'INR'} {r.amount?.toFixed(2)}</span>)}
                        </div>
                        <div className="mt-3 pt-3 border-t border-foreground/10 flex items-center justify-between">
                          <button onClick={() => setDeleteConfirm(r.id)} className="text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer" title="Delete">
                            <Trash2 className="w-[14px] h-[14px]" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">{totalReceipts} total receipts</span>
                  <div className="flex items-center gap-2">
                    {page > 1 && (
                      <button onClick={() => fetchReceipts(page - 1)} className="px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground border border-foreground/10 hover:border-foreground/30 transition-all cursor-pointer">
                        <ChevronLeft className="w-[14px] h-[14px]" />
                      </button>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      p === page ? (
                        <span key={p} className="w-7 h-7 bg-foreground text-background text-[10px] font-mono flex items-center justify-center">{p}</span>
                      ) : (
                        <button key={p} onClick={() => fetchReceipts(p)} className="w-7 h-7 text-[10px] text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer">
                          {p}
                        </button>
                      )
                    ))}
                    {page < totalPages && (
                      <button onClick={() => fetchReceipts(page + 1)} className="px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground border border-foreground/10 hover:border-foreground/30 transition-all cursor-pointer">
                        <ChevronRight className="w-[14px] h-[14px]" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-foreground/10 bg-foreground/[0.02] p-16 text-center">
              <div className="w-20 h-20 mx-auto mb-6 border border-dashed border-foreground/10 flex items-center justify-center">
                <Camera className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-display mb-2">No Receipts Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">Start by scanning a receipt or uploading a voucher image. They&apos;ll appear here for easy browsing.</p>
              <Link href="/receipt/scan" className="px-8 py-3 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all inline-flex items-center gap-2">
                <Upload className="w-[18px] h-[18px]" />Upload Your First Receipt
              </Link>
            </div>
          )}

          <ConfirmDialog
            open={!!deleteConfirm}
            onClose={() => setDeleteConfirm(null)}
            onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); setDeleteConfirm(null); }}
            title="Delete Receipt"
            message="Delete this receipt? This cannot be undone."
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

export default function ReceiptGalleryPage() {
  return <ReceiptGallery />;
}
