'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import { UserPlus, User, Mail, Key, Lock, Eye, EyeOff, ArrowRight, CheckCircle, MailCheck } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: form, 2: OTP
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const otpInputsRef = useRef([]);

  const passwordStrength = (pw) => {
    if (!pw) return { label: '', level: 0, color: '' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
    const levels = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
    return { label: levels[score - 1] || '', level: score, color: colors[score - 1] || '' };
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword } = formData;

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (name.length < 2) {
      setError('Name must be at least 2 characters.');
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
      const response = await api.post('/api/auth/register', { name, email, password });
      setLoading(false);
      if (response.data && response.data.otp_sent) {
        setOtpSent(true);
        setStep(2);
      } else if (response.data && response.data.user) {
        await login(email, password);
        router.push('/dashboard');
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const code = otpCode.join('');
    if (code.length !== 6) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/verify-otp', {
        email: formData.email,
        code
      });
      setLoading(false);
      if (response.data && response.data.user) {
        await login(formData.email, formData.password);
        router.push('/dashboard');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.error || 'Invalid code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/resend-otp', { email: formData.email });
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to resend code.');
    }
  };

  return (
    <div className="w-full max-w-[440px] relative z-10 animate-fade-in-up">
      <div className="mb-8 md:mb-10 flex flex-col items-center text-center">
        <div className="lg:hidden w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-primary-light text-white flex items-center justify-center mb-4 shadow-lg shadow-primary/20">
          <UserPlus className="w-7 h-7" />
        </div>
        <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white mb-2 font-extrabold tracking-tight">Create your account</h1>
        <p className="text-sm text-slate-500 dark:text-dark-mute max-w-[320px]">Join Spendly to start tracking your expenses smarter and simpler.</p>
      </div>

      <div className="card-apple p-6 sm:p-8 md:p-10 shadow-2xl shadow-slate-200/50 dark:shadow-none border-white/60 dark:border-white/5 !rounded-2xl md:!rounded-3xl">
        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {/* Step 1: Registration Form */}
        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            <div className="space-y-2 group">
              <label htmlFor="name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                Full Name
              </label>
              <div className="relative">
                <User className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-4"
                  placeholder="Your full name"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="reg-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                Email Address
              </label>
              <div className="relative">
                <Mail className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  id="reg-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-4"
                  placeholder="email@address.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-end">
                <label htmlFor="reg-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                  Password
                </label>
                <span className="text-[10px] text-slate-400 dark:text-dark-mute font-medium">
                  {passwordStrength(formData.password).label}
                </span>
              </div>
              <div className="relative">
                <Key className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-11"
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
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
              <div className="flex gap-1 mt-1.5" id="password-strength-bar">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i <= passwordStrength(formData.password).level
                        ? passwordStrength(formData.password).color
                        : 'bg-slate-200 dark:bg-dark-border'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors group-focus-within:text-primary">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="text-slate-400 dark:text-dark-border w-[18px] h-[18px] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 pl-11 pr-11"
                  placeholder="Re-enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors absolute right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
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
                    <span>Create Account</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <MailCheck className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Check your email</h3>
            <p className="text-sm text-slate-500 dark:text-dark-mute mb-6">
              We sent a verification code to{' '}
              <strong className="text-slate-700 dark:text-slate-300">{formData.email}</strong>
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Enter verification code</label>
                <div className="flex justify-center gap-2 sm:gap-3" id="otp-inputs">
                  {otpCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-9 sm:w-11 h-10 sm:h-12 text-center border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-base sm:text-lg font-bold text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      required
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3.5 text-sm font-bold shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group !rounded-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <span>Verify & Create Account</span>
                      <CheckCircle className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-dark-border/40">
              <p className="text-xs text-slate-400 dark:text-dark-mute mb-2">Didn&apos;t receive the code?</p>
              <button
                onClick={handleResendOtp}
                disabled={loading}
                className="text-sm font-bold text-primary hover:text-primary-light transition-colors disabled:opacity-50 cursor-pointer"
              >
                Resend code
              </button>
              <p className="text-[10px] text-slate-400 dark:text-dark-mute mt-3">
                The code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-dark-border/40 text-center">
          <p className="text-sm text-slate-500 dark:text-dark-mute mb-2">Already have an account?</p>
          <Link href="/login" className="text-sm font-bold text-primary hover:text-primary-light transition-colors inline-flex items-center justify-center gap-1 group">
            Sign in here
            <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-center text-slate-500 dark:text-dark-mute leading-relaxed max-w-[320px] mx-auto">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="font-medium text-slate-700 dark:text-slate-300 underline hover:text-primary transition-colors">Terms of Service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-slate-700 dark:text-slate-300 underline hover:text-primary transition-colors">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function RegisterPage() {
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
                    Join Spendly today. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-rose-500">Track smarter, live better.</span>
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[360px] leading-relaxed">
                    Create an account in less than a minute and experience local OCR receipt ingestion, budget forecasts, and beautiful reports.
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

            {/* Right Column: Registration Form */}
            <div className="col-span-1 lg:col-span-7 flex flex-col justify-start items-center px-4 sm:px-8 lg:px-12 pt-8 md:pt-16 pb-12 relative bg-canvas dark:bg-dark-bg transition-colors duration-200 min-h-[calc(100vh-64px)]">
              <div className="glow-blob top-1/4 left-1/4 w-72 h-72 bg-primary/5 dark:bg-primary/10"></div>
              <div className="glow-blob bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/5 dark:bg-rose-500/10"></div>

              <RegisterForm />
            </div>
          </section>
        </main>

      </div>
  );
}
