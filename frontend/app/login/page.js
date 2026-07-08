'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import { LogIn, Mail, Key, Eye, EyeOff, ArrowRight } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.push('/dashboard');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `${api.defaults.baseURL}/api/auth/${provider}`;
  };

  return (
    <div className="w-full max-w-[420px] relative z-10 animate-fade-in-up">
      <div className="mb-8 md:mb-10 flex flex-col items-center text-center">
        <div className="lg:hidden w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <LogIn className="w-7 h-7" />
        </div>
        <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white mb-2 font-extrabold tracking-tight">Welcome back</h1>
        <p className="text-sm text-slate-500 dark:text-dark-mute max-w-[300px]">Sign in to your Spendly account to manage your expenses.</p>
      </div>

      <div className="card-apple p-6 sm:p-8 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/60 dark:border-white/5 !rounded-2xl md:!rounded-3xl">
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="oauth-btn oauth-google w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-dark-border py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <svg className="oauth-icon shrink-0" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-slate-700 dark:text-slate-200">Continue with Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="oauth-btn oauth-github w-full flex items-center justify-center gap-3 border border-slate-200 dark:border-dark-border py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <svg className="oauth-icon shrink-0" viewBox="0 0 98 96" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" className="fill-slate-800 dark:fill-white"/>
            </svg>
            <span className="text-slate-700 dark:text-slate-200">Continue with GitHub</span>
          </button>
        </div>

        <div className="divider-oauth mt-6 mb-6 text-center text-xs text-slate-400 flex items-center justify-center gap-3">
          <span className="h-[1px] flex-1 bg-slate-200/80 dark:bg-dark-border/60"></span>
          <span className="shrink-0">or sign in with email</span>
          <span className="h-[1px] flex-1 bg-slate-200/80 dark:bg-dark-border/60"></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2 group">
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
              Email Address
            </label>
            <div className="relative">
              <Mail className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-4"
                placeholder="email@address.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <div className="flex justify-between items-end">
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                Password
              </label>
              <Link href="/forgot-password" className="text-[10px] font-medium text-primary hover:text-primary-light transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Key className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-11"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
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
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group !rounded-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-dark-border/40 text-center">
          <p className="text-sm text-slate-500 dark:text-dark-mute mb-2">Don&apos;t have an account?</p>
          <Link href="/register" className="text-sm font-bold text-primary hover:text-primary-light transition-colors inline-flex items-center justify-center gap-1 group">
            Create a free account
            <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-center text-slate-500 dark:text-dark-mute leading-relaxed max-w-[320px] mx-auto">
        By signing in, you agree to our{' '}
        <Link href="/terms" className="font-medium text-slate-700 dark:text-slate-300 underline hover:text-primary transition-colors">Terms of Service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-slate-700 dark:text-slate-300 underline hover:text-primary transition-colors">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />

        <main className="flex-grow">
          <section className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-12 overflow-x-hidden relative">
            {/* Left Column: Branding */}
            <div className="hidden lg:flex lg:col-span-5 bg-slate-50 dark:bg-[#080b11] text-slate-800 dark:text-white border-r border-slate-200/50 dark:border-none flex-col justify-between p-8 xl:p-12 relative overflow-hidden min-h-[calc(100vh-64px)]">
              <div className="absolute -top-12 -left-12 w-[350px] h-[350px] bg-primary/5 dark:bg-primary/20 rounded-full blur-[80px]"></div>
              <div className="absolute -bottom-12 -right-12 w-[350px] h-[350px] bg-rose-500/10 dark:bg-rose-500/25 rounded-full blur-[90px]"></div>
              <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>

              <div className="relative z-10 mt-6 lg:mt-8 xl:mt-12 space-y-6 xl:space-y-8">
                <div className="space-y-3">
                  <h2 className="text-3xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-white">
                    Control your wealth, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-rose-500">one ledger at a time.</span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[360px] leading-relaxed">
                    Sync transactions, scan physical receipts, and forecast your burn rate automatically with Spendly personal ledger.
                  </p>
                </div>

                <div className="relative max-w-[360px] group transition-all duration-500 hover:scale-[1.02]">
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary to-rose-500 opacity-20 blur-lg transition duration-700 group-hover:opacity-40"></div>
                  <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 xl:p-6 shadow-2xl space-y-4 xl:space-y-5">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-400 font-mono tracking-widest uppercase">Available Balance</p>
                        <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white mt-0.5">$14,240.85</p>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L7 9.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L9 9.586 12.586 6H12z" clipRule="evenodd" />
                        </svg>
                        +12.8%
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-400">Monthly Burn Rate Limit</span>
                        <span className="text-slate-800 dark:text-white font-mono">68% ($3,400 / $5,000)</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-primary to-primary-light h-1.5 rounded-full" style={{ width: '68%' }}></div>
                      </div>
                    </div>

                    <div className="space-y-2.5 xl:space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <p className="text-[9px] text-slate-400 dark:text-slate-400 font-mono tracking-widest uppercase mb-1">Recent Activities</p>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs">🛒</div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">Local Grocery Store</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">Today, 2:32 PM</p>
                          </div>
                        </div>
                        <span className="font-mono text-slate-800 dark:text-slate-200">-$84.50</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs">☁️</div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">AI Server Cloud Host</p>
                            <p className="text-[9px] text-slate-400 dark:text-slate-500">Yesterday, 9:15 AM</p>
                          </div>
                        </div>
                        <span className="font-mono text-slate-800 dark:text-slate-200">-$15.00</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="col-span-1 lg:col-span-7 flex flex-col justify-start items-center px-4 sm:px-8 lg:px-12 pt-8 md:pt-16 pb-12 relative bg-canvas dark:bg-dark-bg transition-colors duration-200 min-h-[calc(100vh-64px)]">
              <div className="glow-blob top-1/4 left-1/4 w-72 h-72 bg-primary/5 dark:bg-primary/10"></div>
              <div className="glow-blob bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/5 dark:bg-rose-500/10"></div>

              <LoginForm />
            </div>
          </section>
        </main>

      </div>
  );
}
