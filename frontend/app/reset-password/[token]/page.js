'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../components/AuthContext';
import { Navigation } from '../../../components/landing/navigation';
import { FooterSection } from '../../../components/landing/footer-section';
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
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />

      <div className="pt-32 pb-24 px-6 lg:px-12 max-w-[1400px] mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="max-w-[420px] w-full">
            <div className="text-center mb-10">
              <div className="w-14 h-14 mx-auto border border-foreground/10 rounded-xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-7 h-7 text-muted-foreground" />
              </div>
              <h1 className="text-3xl font-display tracking-tight mb-2">
                {success ? 'Password updated' : 'New password'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {success
                  ? 'Your vault key has been rotated successfully.'
                  : 'Define a secure new passphrase for your account.'}
              </p>
            </div>

            <div className="border border-foreground/10 bg-foreground/[0.02] p-8 md:p-10 rounded-2xl">
              {error && (
                <div className="mb-6 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium text-center rounded-xl">
                  {error}
                </div>
              )}

              {success ? (
                <div className="text-center space-y-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your password has been reset. You can now sign in with your new credentials.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all cursor-pointer"
                  >
                    Sign in
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-2 group">
                    <label htmlFor="reset-password" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">
                      New Passphrase
                    </label>
                    <div className="relative">
                      <Key className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        id="reset-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                        placeholder="Min. 6 characters"
                        autoComplete="new-password"
                        minLength={6}
                        required
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-foreground transition-colors absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                      </button>
                    </div>
                    {password && (
                      <div className="mt-2 space-y-1">
                        <div className="w-full h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-300 ${strength.color}`} style={{ width: strength.width }}></div>
                        </div>
                        <p className="text-[10px] font-medium text-muted-foreground">{strength.label}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 group">
                    <label htmlFor="reset-confirm" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">
                      Confirm Passphrase
                    </label>
                    <div className="relative">
                      <ShieldCheck className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                      <input
                        id="reset-confirm"
                        type={showConfirm ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                        placeholder="Re-enter password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="text-muted-foreground hover:text-foreground transition-colors absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
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
                      className="w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
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

              <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
                <Link href="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors inline-flex items-center gap-1 group">
                  <ArrowLeft className="w-[16px] h-[16px] transition-transform group-hover:-translate-x-0.5" />
                  Return to sign in
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
