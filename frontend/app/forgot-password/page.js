'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow flex items-center justify-center px-4 py-24 relative overflow-hidden">
          <div className="glow-blob top-1/4 left-1/4 w-72 h-72 bg-primary/5"></div>

          <div className="max-w-[420px] w-full relative z-10 animate-fade-in-up">
            <div className="card-apple p-8 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/60 dark:border-white/5 !rounded-2xl md:!rounded-3xl">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
                <Mail className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white text-center mb-2">Forgot password?</h1>
              <p className="text-sm text-slate-500 dark:text-dark-mute text-center mb-8">
                {sent
                  ? 'If an account exists with that email, we\'ve sent a reset link.'
                  : 'Enter your email and we\'ll send you a reset link.'}
              </p>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
                  {error}
                </div>
              )}

              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 group">
                    <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-4"
                        placeholder="email@address.com"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group !rounded-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                    {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send className="w-[18px] h-[18px]" />}
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-slate-400 dark:text-dark-mute mb-6">Check your inbox and follow the link to reset your password. The link expires in 1 hour.</p>
                  <Link href="/login" className="text-sm font-bold text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1 group">
                    <ArrowLeft className="w-[16px] h-[16px]" />
                    Back to sign in
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-border/40 text-center">
                <Link href="/login" className="text-sm font-bold text-primary hover:text-primary-light transition-colors inline-flex items-center gap-1 group">
                  <ArrowLeft className="w-[16px] h-[16px]" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
  );
}
