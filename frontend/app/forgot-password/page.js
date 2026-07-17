'use client';

import { useState } from 'react';
import Link from 'next/link';
import { api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
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
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-[420px] w-full">
            <div className="text-center mb-10">
              <div className="w-14 h-14 mx-auto border border-foreground/10 rounded-xl flex items-center justify-center mb-5">
                <Mail className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-display tracking-tight mb-2">Forgot password?</h1>
              <p className="text-sm text-muted-foreground">
                {sent
                  ? 'If an account exists with that email, we\'ve sent a reset link.'
                  : 'Enter your email and we\'ll send you a reset link.'}
              </p>
            </div>

            <div className="border border-foreground/10 bg-foreground/[0.02] p-8 md:p-10 rounded-2xl">
              {error && (
                <div className="mb-4 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium text-center rounded-xl">
                  {error}
                </div>
              )}

              {!sent ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2 group">
                    <label htmlFor="reset-email" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                        placeholder="email@address.com"
                        required
                        autoFocus
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <Send className="w-[18px] h-[18px]" />
                        Send Reset Link
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-6">Check your inbox and follow the link to reset your password. The link expires in 1 hour.</p>
                  <Link href="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1 group">
                    <ArrowLeft className="w-[16px] h-[16px]" />
                    Back to sign in
                  </Link>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-foreground/10 text-center">
                <Link href="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1 group">
                  <ArrowLeft className="w-[16px] h-[16px]" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <FooterSection />
    </main>
  );
}
