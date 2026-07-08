'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../components/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Key, Eye, EyeOff, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = (pwd) => {
    if (!pwd) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pwd.length >= 6) score += 25;
    if (pwd.length >= 10) score += 25;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/[0-9]/.test(pwd)) score += 15;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 15;
    if (score < 30) return { label: 'Weak', color: 'bg-red-500', width: `${score}%` };
    if (score < 60) return { label: 'Fair', color: 'bg-orange-500', width: `${score}%` };
    if (score < 80) return { label: 'Good', color: 'bg-yellow-500', width: `${score}%` };
    return { label: 'Strong', color: 'bg-emerald-500', width: `${score}%` };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${token}`, {
        password,
        confirm_password: confirmPassword
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 py-24 relative overflow-hidden">
        <div className="glow-blob top-1/4 -right-20 w-72 h-72 bg-primary/5"></div>
        <div className="glow-blob bottom-1/4 -left-20 w-72 h-72 bg-signature-peach/5"></div>

        <div className="max-w-[420px] w-full relative z-10 animate-fade-in-up">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-signature-forest/10 text-signature-forest dark:text-signature-mint flex items-center justify-center mb-5 shadow-sm border border-signature-forest/20 -rotate-3">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
              {success ? 'Password updated' : 'New password'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-dark-mute max-w-[300px]">
              {success
                ? 'Your vault key has been rotated successfully.'
                : 'Define a secure new passphrase for your account.'}
            </p>
          </div>

          <div className="card-apple p-8 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/60 dark:border-white/5 !rounded-2xl md:!rounded-3xl">
            {error && (
              <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <p className="text-sm text-slate-500 dark:text-dark-mute">
                  Your password has been reset. You can now sign in with your new credentials.
                </p>
                <Link
                  href="/login"
                  className="btn-primary w-full inline-flex items-center justify-center gap-2 py-3.5 text-sm font-bold shadow-xl shadow-primary/20 !rounded-full cursor-pointer"
                >
                  Sign in
                  <ArrowRight className="w-[18px] h-[18px]" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2 group">
                  <label htmlFor="reset-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                    New Passphrase
                  </label>
                  <div className="relative">
                    <Key className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <input
                      id="reset-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-11"
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      minLength={6}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }}></div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-dark-mute">{strength.label}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2 group">
                  <label htmlFor="reset-confirm" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                    Confirm Passphrase
                  </label>
                  <div className="relative">
                    <ShieldCheck className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                    <input
                      id="reset-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-11"
                      placeholder="Re-enter password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
                      aria-label="Toggle confirm visibility"
                    >
                      {showConfirm ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-[10px] font-medium text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 !rounded-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Update Vault Key</span>
                        <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-dark-border/40 text-center">
              <Link href="/login" className="text-sm font-bold text-slate-500 dark:text-dark-mute hover:text-primary dark:hover:text-primary-light transition-colors inline-flex items-center gap-1 group">
                <ArrowLeft className="w-[16px] h-[16px] transition-transform group-hover:-translate-x-0.5" />
                Return to sign in
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
