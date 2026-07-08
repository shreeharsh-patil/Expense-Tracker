'use client';

import React, { useState, useRef } from 'react';
import { useAuth, api } from '../../../components/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { CloudUpload, Brain, FileText, CreditCard, Tags, Save, Database, CheckCircle, ArrowRight } from 'lucide-react';

function ScanReceiptForm() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG or PNG).');
      return;
    }

    setFile(selectedFile);
    setFileName(selectedFile.name.length > 25 ? selectedFile.name.substring(0, 22) + '...' : selectedFile.name);
    setError('');
    setOcrResult(null);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        try { fileInputRef.current.files = dt.files; } catch (_) {}
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('receipt', file);

      const response = await api.post('/api/expenses/scan-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data) {
        setOcrResult(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'OCR processing failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async (e) => {
    e.preventDefault();
    if (!ocrResult) return;

    setLoading(true);
    try {
      await api.post('/api/expenses/add-expense', {
        amount: ocrResult.amount,
        category: ocrResult.category,
        description: ocrResult.raw_text?.substring(0, 200) || '',
        source: 'receipt_scan'
      });
      setOcrResult(null);
      setFile(null);
      setPreview(null);
      setFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
          <Database className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sign in to scan receipts</h3>
        <p className="text-sm text-slate-500 dark:text-dark-mute mb-6">You need to be logged in to use the OCR receipt scanner.</p>
        <a href="/login" className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold">
          Sign In <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in-up">
      {error && (
        <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* Header Section */}
      <section className="mb-8 md:mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6 relative">
        <div className="glow-blob -top-10 -left-10 w-48 h-48 bg-primary/10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest">Automated Ingest</span>
          </div>
          <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white font-extrabold tracking-tight mb-1">
            Voucher Scanning
          </h1>
          <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Convert physical receipts into ledger entries using our optical processing engine.</p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/5 border border-emerald-500/10 dark:border-emerald-500/10 flex items-center gap-2">
            <CheckCircle className="w-[18px] h-[18px] text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold text-center">OCR ENGINE ACTIVE</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Upload Zone */}
        <div className="lg:col-span-7">
          <div className="card-apple p-1 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5 overflow-hidden">
            <form onSubmit={handleSubmit}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />

              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative border-2 border-dashed rounded-[15px] py-20 px-8 text-center cursor-pointer transition-all duration-500 min-h-[400px] flex flex-col items-center justify-center bg-white dark:bg-dark-card ${
                  dragActive
                    ? 'border-primary bg-primary/[0.02] dark:bg-primary/[0.02]'
                    : 'border-slate-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 hover:bg-primary/[0.01] dark:hover:bg-primary/[0.02]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                {!preview ? (
                  <div className="relative z-10 flex flex-col items-center transition-transform duration-500 group-hover:scale-105">
                    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-white/5 flex items-center justify-center mb-8 border border-slate-100 dark:border-white/10 shadow-inner group-hover:shadow-lg group-hover:shadow-primary/10 transition-all group-hover:-rotate-3">
                      <CloudUpload className="w-10 h-10 text-primary dark:text-primary-light" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Drop receipt here</h3>
                    <p className="text-xs text-slate-500 dark:text-dark-mute max-w-[240px] leading-relaxed">Securely upload JPEG or PNG vouchers for automated parsing.</p>

                    <div className="mt-8 flex items-center gap-4">
                      <div className="h-px w-8 bg-slate-200 dark:bg-white/10"></div>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-dark-mute uppercase tracking-widest font-bold">OR</span>
                      <div className="h-px w-8 bg-slate-200 dark:bg-white/10"></div>
                    </div>

                    <button type="button" className="mt-8 btn-primary px-8 py-2.5 text-xs font-bold shadow-lg shadow-primary/20">
                      Select File
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10 w-full">
                    <div className="max-w-[280px] mx-auto relative rounded-xl overflow-hidden shadow-2xl border-4 border-white dark:border-white/5">
                      <img src={preview} alt="Receipt Preview" className="w-full h-auto object-contain bg-slate-100 dark:bg-dark-bg" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-4">
                        <p className="text-[10px] text-white font-mono font-bold tracking-widest">{fileName}</p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-10 btn-primary px-10 py-3 text-sm font-bold shadow-xl shadow-primary/30 flex items-center justify-center gap-3 mx-auto group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      ) : (
                        <>
                          Start Optical Analysis
                          <Brain className="w-[18px] h-[18px] animate-pulse" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Extraction Results */}
        <div className="lg:col-span-5">
          <div className="card-apple p-8 shadow-2xl shadow-slate-200/40 dark:shadow-none border-white/60 dark:border-white/5 relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <FileText className="w-[18px] h-[18px]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Parser Extraction</h3>
            </div>

            {ocrResult ? (
              <form onSubmit={handleCommit} className="space-y-6 flex-1">
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">
                    Detected Amount
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      defaultValue={ocrResult.amount || ''}
                      className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-mono font-bold text-slate-900 dark:text-white"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-primary/70 font-bold uppercase tracking-tight italic">Verified via optical pattern match</p>
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">
                    Classified Category
                  </label>
                  <div className="relative flex items-center">
                    <Tags className="absolute left-0 text-slate-400 dark:text-dark-border w-[18px] h-[18px]" />
                    <select
                      name="category"
                      defaultValue={ocrResult.category || ''}
                      className="w-full bg-transparent border-b border-slate-200 dark:border-dark-border py-2.5 pl-7 outline-none focus:border-primary dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white appearance-none cursor-pointer"
                    >
                      <option value="Food">Food & Dining</option>
                      <option value="Transport">Transportation</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Bills">Bills & Rent</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Health">Health</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono font-bold text-slate-500 dark:text-dark-mute uppercase tracking-widest transition-colors group-focus-within:text-primary">
                    Confidence Log
                  </label>
                  <div className="bg-slate-50 dark:bg-white/[0.02] rounded-xl p-4 border border-slate-100 dark:border-white/5 font-mono text-[9px] text-slate-500 dark:text-dark-mute leading-relaxed max-h-[120px] overflow-y-auto">
                    {ocrResult.raw_text?.substring(0, 500)}{ocrResult.raw_text?.length > 500 ? '...' : ''}
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-dark-border/40 mt-auto">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-xs font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        Commit to Ledger
                        <Save className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/[0.02] flex items-center justify-center mb-4 border border-dashed border-slate-200 dark:border-white/10 opacity-50">
                  <Database className="w-8 h-8 text-slate-400 dark:text-dark-border" />
                </div>
                <p className="text-xs font-bold text-slate-400 dark:text-dark-mute uppercase tracking-widest">Pending Acquisition</p>
                <p className="text-[10px] text-slate-400 dark:text-dark-mute mt-2 max-w-[200px]">Upload a voucher to initiate automated data extraction protocols.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScanReceiptPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow py-6">
          <ScanReceiptForm />
        </main>
        <Footer />
      </div>
  );
}
