'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
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
    <div className="w-full max-w-[420px] mx-auto">
      <div className="text-center mb-10">
        <div className="w-14 h-14 mx-auto border border-foreground/10 rounded-xl flex items-center justify-center mb-4">
          <LogIn className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-display tracking-tight mb-2">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to your Spendly account to manage your expenses.</p>
      </div>

      <div className="border border-foreground/10 bg-foreground/[0.02] p-8 md:p-10 rounded-2xl">
        {error && (
          <div className="mb-6 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium text-center rounded-xl">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 border border-foreground/10 rounded-xl py-2.5 px-4 text-sm font-medium hover:bg-foreground/[0.02] transition-colors cursor-pointer"
          >
            <svg className="shrink-0" viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span className="text-foreground/80">Continue with Google</span>
          </button>
          <button
            onClick={() => handleOAuthLogin('github')}
            className="w-full flex items-center justify-center gap-3 border border-foreground/10 rounded-xl py-2.5 px-4 text-sm font-medium hover:bg-foreground/[0.02] transition-colors cursor-pointer"
          >
            <svg className="shrink-0" viewBox="0 0 98 96" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
            </svg>
            <span className="text-foreground/80">Continue with GitHub</span>
          </button>
        </div>

        <div className="mt-6 mb-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-3">
          <span className="h-px flex-1 bg-foreground/10"></span>
          <span className="shrink-0">or sign in with email</span>
          <span className="h-px flex-1 bg-foreground/10"></span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="space-y-2 group">
            <label htmlFor="login-email" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">
              Email Address
            </label>
            <div className="relative">
              <Mail className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                placeholder="email@address.com"
                autoComplete="email"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-2 group">
            <div className="flex justify-between items-end">
              <label htmlFor="login-password" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">
                Password
              </label>
              <Link href="/forgot-password" className="text-[10px] font-medium text-foreground/50 hover:text-foreground transition-colors">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Key className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
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
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
          <p className="text-sm text-muted-foreground mb-2">Don&apos;t have an account?</p>
          <Link href="/register" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors inline-flex items-center justify-center gap-1 group">
            Create a free account
            <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-center text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
        By signing in, you agree to our{' '}
        <Link href="/terms" className="font-medium text-foreground/70 underline hover:text-foreground transition-colors">Terms of Service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-foreground/70 underline hover:text-foreground transition-colors">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className="flex items-center justify-center">
          <LoginForm />
        </div>
      </div>
      <FooterSection />
    </main>
  );
}
