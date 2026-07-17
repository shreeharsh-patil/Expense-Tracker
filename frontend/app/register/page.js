'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { UserPlus, User, Mail, Key, Lock, Eye, EyeOff, ArrowRight, CheckCircle, MailCheck } from 'lucide-react';

function RegisterForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
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
      const response = await api.post('/api/auth/verify-otp', { email: formData.email, code });
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
    <div className="w-full max-w-[440px] mx-auto">
      <div className="text-center mb-10">
        <div className="w-14 h-14 mx-auto border border-foreground/10 rounded-xl flex items-center justify-center mb-4">
          <UserPlus className="w-7 h-7 text-muted-foreground" />
        </div>
        <h1 className="text-3xl font-display tracking-tight mb-2">Create your account</h1>
        <p className="text-sm text-muted-foreground">Join Spendly to start tracking your expenses smarter and simpler.</p>
      </div>

      <div className="border border-foreground/10 bg-foreground/[0.02] p-8 md:p-10 rounded-2xl">
        {error && (
          <div className="mb-6 p-3 border border-foreground/10 text-muted-foreground text-xs font-medium text-center rounded-xl">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRegister} className="space-y-5" noValidate>
            <div className="space-y-2 group">
              <label htmlFor="name" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">Full Name</label>
              <div className="relative">
                <User className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input id="name" type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                  placeholder="Your full name" required autoFocus />
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="reg-email" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input id="reg-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                  placeholder="email@address.com" required />
              </div>
            </div>

            <div className="space-y-2 group">
              <div className="flex justify-between items-end">
                <label htmlFor="reg-password" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">Password</label>
                <span className="text-[10px] text-muted-foreground">{passwordStrength(formData.password).label}</span>
              </div>
              <div className="relative">
                <Key className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input id="reg-password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                  placeholder="Min. 6 characters" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
                  aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
              <div className="flex gap-1 mt-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= passwordStrength(formData.password).level ? passwordStrength(formData.password).color : 'bg-foreground/10'
                  }`}></div>
                ))}
              </div>
            </div>

            <div className="space-y-2 group">
              <label htmlFor="reg-confirm-password" className="block text-xs font-medium text-foreground/70 transition-colors group-focus-within:text-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="text-muted-foreground w-[18px] h-[18px] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input id="reg-confirm-password" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-foreground/[0.02] border border-foreground/10 rounded-xl py-3 pl-10 pr-10 outline-none focus:border-foreground/30 focus:bg-foreground/[0.04] transition-all text-sm text-foreground"
                  placeholder="Re-enter your password" required />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center p-1 cursor-pointer"
                  aria-label="Toggle password visibility">
                  {showConfirmPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button type="submit" disabled={loading}
                className="w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                ) : (
                  <><span>Create Account</span><ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" /></>
                )}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto border border-foreground/10 rounded-xl flex items-center justify-center mb-4">
              <MailCheck className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-display mb-2">Check your email</h3>
            <p className="text-sm text-muted-foreground mb-6">
              We sent a verification code to{' '}
              <strong className="text-foreground">{formData.email}</strong>
            </p>

            <form onSubmit={handleOtpSubmit} className="space-y-5" noValidate>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-foreground/70 mb-2">Enter verification code</label>
                <div className="flex justify-center gap-2 sm:gap-3">
                  {otpCode.map((digit, index) => (
                    <input key={index} ref={(el) => (otpInputsRef.current[index] = el)}
                      type="text" maxLength={1} value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      className="w-9 sm:w-11 h-10 sm:h-12 text-center border border-foreground/10 rounded-lg outline-none focus:border-foreground/30 transition-all text-base sm:text-lg font-mono text-foreground bg-foreground/[0.02]"
                      inputMode="numeric" pattern="[0-9]*" required autoFocus={index === 0} />
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                  ) : (
                    <><span>Verify & Create Account</span><CheckCircle className="w-[18px] h-[18px] transition-transform group-hover:translate-x-1" /></>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-foreground/10">
              <p className="text-xs text-muted-foreground mb-2">Didn&apos;t receive the code?</p>
              <button onClick={handleResendOtp} disabled={loading}
                className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer">
                Resend code
              </button>
              <p className="text-[10px] text-muted-foreground mt-3">The code expires in 10 minutes. Check your spam folder if you don&apos;t see it.</p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-foreground/10 text-center">
          <p className="text-sm text-muted-foreground mb-2">Already have an account?</p>
          <Link href="/login" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors inline-flex items-center justify-center gap-1 group">
            Sign in here
            <ArrowRight className="w-[16px] h-[16px] transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-center text-muted-foreground leading-relaxed max-w-[320px] mx-auto">
        By creating an account, you agree to our{' '}
        <Link href="/terms" className="font-medium text-foreground/70 underline hover:text-foreground transition-colors">Terms of Service</Link>{' '}
        and{' '}
        <Link href="/privacy" className="font-medium text-foreground/70 underline hover:text-foreground transition-colors">Privacy Policy</Link>.
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className="flex items-center justify-center">
          <RegisterForm />
        </div>
      </div>
      <FooterSection />
    </main>
  );
}
