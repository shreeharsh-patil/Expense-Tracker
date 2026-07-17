'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../../components/AuthContext';
import { Navigation } from '../../../components/landing/navigation';
import { FooterSection } from '../../../components/landing/footer-section';
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
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
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
        setEditAmount(String(response.data.amount || ''));
        setEditCategory(response.data.category || 'Food');
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
        amount: parseFloat(editAmount) || ocrResult.amount,
        category: editCategory || ocrResult.category,
        description: ocrResult.raw_text?.substring(0, 200) || '',
        source: 'receipt_scan'
      });
      setOcrResult(null);
      setEditAmount('');
      setEditCategory('');
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
        <div className="w-16 h-16 mx-auto border border-foreground/10 flex items-center justify-center mb-6">
          <Database className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-display mb-2">Sign in to scan receipts</h3>
        <p className="text-sm text-muted-foreground mb-6">You need to be logged in to use the OCR receipt scanner.</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all">
          Sign In <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-10">
      {error && (
        <div className="mb-6 p-3 border border-foreground/10 bg-foreground/[0.03] text-muted-foreground text-xs font-medium text-center max-w-2xl mx-auto">
          {error}
        </div>
      )}

      {/* Header Section */}
      <section className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
            <span className="w-8 h-px bg-foreground/30" />
            Automated Ingest
          </span>
          <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">
            Voucher
            <br />
            <span className="text-muted-foreground">Scanning.</span>
          </h1>
          <p className="text-base text-muted-foreground">Convert physical receipts into ledger entries using our optical processing engine.</p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="px-4 py-2 border border-emerald-500/20 flex items-center gap-2">
            <CheckCircle className="w-[18px] h-[18px] text-emerald-500" />
            <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-widest font-medium">OCR ENGINE ACTIVE</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Upload Zone */}
        <div className="lg:col-span-7">
          <div className="border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
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
                className={`group relative border-2 border-dashed py-20 px-8 text-center cursor-pointer transition-all duration-500 min-h-[400px] flex flex-col items-center justify-center ${
                  dragActive
                    ? 'border-foreground/50 bg-foreground/[0.03]'
                    : 'border-foreground/20 hover:border-foreground/40 hover:bg-foreground/[0.01]'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-foreground/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                {!preview ? (
                  <div className="relative z-10 flex flex-col items-center transition-transform duration-500 group-hover:scale-105">
                    <div className="w-20 h-20 border border-foreground/10 flex items-center justify-center mb-8 transition-all group-hover:shadow-lg group-hover:-rotate-3">
                      <CloudUpload className="w-10 h-10 text-foreground/40" />
                    </div>
                    <h3 className="text-lg font-display mb-2 tracking-tight">Drop receipt here</h3>
                    <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">Securely upload JPEG or PNG vouchers for automated parsing.</p>

                    <div className="mt-8 flex items-center gap-4">
                      <div className="h-px w-8 bg-foreground/10"></div>
                      <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">OR</span>
                      <div className="h-px w-8 bg-foreground/10"></div>
                    </div>

                    <button type="button" className="mt-8 px-8 py-2.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer">
                      Select File
                    </button>
                  </div>
                ) : (
                  <div className="relative z-10 w-full">
                    <div className="max-w-[280px] mx-auto relative border border-foreground/10 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Receipt Preview" className="w-full h-auto object-contain" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent flex items-end justify-center p-4">
                        <p className="text-[10px] text-background font-mono tracking-widest">{fileName}</p>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-10 px-10 py-3 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-3 mx-auto group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
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
          <div className="border border-foreground/10 bg-foreground/[0.02] p-8 relative overflow-hidden h-full flex flex-col">
            <div className="absolute top-0 right-0 w-32 h-32 bg-foreground/[0.02] rounded-bl-full pointer-events-none"></div>

            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 border border-foreground/10 text-foreground/50 flex items-center justify-center">
                <FileText className="w-[18px] h-[18px]" />
              </div>
              <h3 className="text-sm font-medium text-foreground uppercase tracking-tight">Parser Extraction</h3>
            </div>

            {ocrResult ? (
              <form onSubmit={handleCommit} className="space-y-6 flex-1">
                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">
                    Detected Amount
                  </label>
                  <div className="relative flex items-center">
                    <CreditCard className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm font-mono text-foreground"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <p className="text-[9px] text-foreground/40 font-mono tracking-tight">Verified via optical pattern match</p>
                </div>

                <div className="space-y-2 group">
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">
                    Classified Category
                  </label>
                  <div className="relative flex items-center">
                    <Tags className="absolute left-0 text-muted-foreground w-[18px] h-[18px]" />
                    <select
                      name="category"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full bg-transparent border-b border-foreground/10 py-2.5 pl-7 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer"
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
                  <label className="block text-[10px] font-mono text-muted-foreground uppercase tracking-widest transition-colors group-focus-within:text-foreground">
                    Confidence Log
                  </label>
                  <div className="border border-foreground/10 p-4 font-mono text-[9px] text-muted-foreground leading-relaxed max-h-[120px] overflow-y-auto">
                    {ocrResult.raw_text?.substring(0, 500)}{ocrResult.raw_text?.length > 500 ? '...' : ''}
                  </div>
                </div>

                <div className="pt-6 border-t border-foreground/10 mt-auto">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 text-xs font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
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
                <div className="w-16 h-16 border border-foreground/10 flex items-center justify-center mb-4 opacity-50">
                  <Database className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Pending Acquisition</p>
                <p className="text-[10px] text-muted-foreground mt-2 max-w-[200px]">Upload a voucher to initiate automated data extraction protocols.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScanReceiptPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <main className={`relative min-h-screen overflow-x-hidden bg-background transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
      <Navigation />
      <div className="pt-28 pb-16 md:pb-12 has-bottom-nav">
        <ScanReceiptForm />
      </div>
      <FooterSection />
    </main>
  );
}
