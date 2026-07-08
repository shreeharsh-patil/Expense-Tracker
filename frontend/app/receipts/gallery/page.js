'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../../components/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Camera, Upload, Trash2, ChevronLeft, ChevronRight, Image, Receipt } from 'lucide-react';

function ReceiptGallery() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReceipts, setTotalReceipts] = useState(0);
  const [error, setError] = useState('');

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

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReceipts();
  }, [user, fetchReceipts]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this receipt?')) return;
    try {
      await api.post(`/receipts/${id}/delete`);
      fetchReceipts(page);
    } catch (err) {
      console.error('Delete failed');
    }
  };

  const getImageUrl = (filename) => {
    if (!filename) return null;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
    return `${apiUrl}/uploads/receipts/${filename}`;
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to view receipts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Document Archive</span>
          </div>
          <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">Receipt Gallery</h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Browse all your digitized vouchers and scanned receipts.</p>
        </div>
        <Link href="/receipt/scan" className="btn-primary px-5 py-2.5 text-xs font-bold shadow-lg shadow-primary/20 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload New
        </Link>
      </section>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="card-apple p-0 overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-slate-200 dark:bg-dark-border"></div>
              <div className="p-3 md:p-4 space-y-2">
                <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 dark:bg-dark-border rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : receipts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {receipts.map((r) => {
              const imageUrl = getImageUrl(r.filename);
              return (
                <div key={r.id} className="card-apple p-0 overflow-hidden hover-lift group flex flex-col border-white/60 dark:border-white/5">
                  <div className="relative aspect-[3/4] bg-slate-100 dark:bg-dark-bg overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={r.original_name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-slate-400 dark:text-dark-border" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-12 h-12 text-slate-400 dark:text-dark-border" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                      <div className="flex gap-2 w-full">
                        <span className={`text-[9px] text-white px-2 py-1 rounded-full font-bold uppercase tracking-widest ${r.expense_id ? 'bg-primary/80' : 'bg-slate-500/80'}`}>
                          {r.expense_id ? 'Linked' : 'Unlinked'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 flex-1 flex flex-col">
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate" title={r.original_name}>
                      {r.original_name?.length > 28 ? r.original_name.substring(0, 25) + '...' : r.original_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 dark:text-dark-mute">
                      <span>{r.created_at?.substring(0, 10) || ''}</span>
                      {r.amount && (
                        <span className="font-mono font-bold text-slate-600 dark:text-dark-mute">{r.currency || 'INR'} {r.amount?.toFixed(2)}</span>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-dark-border/40 flex items-center justify-between">
                      <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-accent-red transition-colors p-1 cursor-pointer" title="Delete">
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
              <span className="text-[10px] text-slate-500 dark:text-dark-mute font-medium">{totalReceipts} total receipts</span>
              <div className="flex items-center gap-2">
                {page > 1 && (
                  <button onClick={() => fetchReceipts(page - 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-primary hover:bg-primary/10 border border-slate-200 dark:border-white/10 transition-all cursor-pointer">
                    <ChevronLeft className="w-[14px] h-[14px]" />
                  </button>
                )}
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  p === page ? (
                    <span key={p} className="w-7 h-7 rounded-lg bg-primary text-white text-[10px] font-bold flex items-center justify-center">{p}</span>
                  ) : (
                    <button key={p} onClick={() => fetchReceipts(p)} className="w-7 h-7 rounded-lg text-[10px] font-bold text-slate-500 hover:text-primary hover:bg-primary/10 flex items-center justify-center transition-all cursor-pointer">
                      {p}
                    </button>
                  )
                ))}
                {page < totalPages && (
                  <button onClick={() => fetchReceipts(page + 1)} className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-primary hover:bg-primary/10 border border-slate-200 dark:border-white/10 transition-all cursor-pointer">
                    <ChevronRight className="w-[14px] h-[14px]" />
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card-apple p-16 text-center border-white/60 dark:border-white/5">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center mx-auto mb-6 border border-dashed border-slate-200 dark:border-white/10">
            <Camera className="w-10 h-10 text-slate-400 dark:text-dark-border" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Receipts Yet</h3>
          <p className="text-sm text-slate-500 dark:text-dark-mute max-w-sm mx-auto mb-8">Start by scanning a receipt or uploading a voucher image. They&apos;ll appear here for easy browsing.</p>
          <Link href="/receipt/scan" className="btn-primary px-8 py-3 text-sm font-bold shadow-lg shadow-primary/20 inline-flex items-center gap-2">
            <Upload className="w-[18px] h-[18px]" />
            Upload Your First Receipt
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ReceiptGalleryPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <ReceiptGallery />
        </main>
        <Footer />
      </div>
  );
}
