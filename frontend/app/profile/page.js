'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { User, Mail, Phone, Save, Lock, Shield, Camera } from 'lucide-react';

function ProfileSettings() {
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [oauthProvider, setOauthProvider] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(user.name || '');
    setEmail(user.email || '');
    api.get('/api/profile')
      .then(res => {
        if (res.data?.user) {
          setPhone(res.data.user.phone || '');
          setCurrency(res.data.user.preferred_currency || 'INR');
          setAvatarUrl(res.data.user.avatar_url || '');
          setOauthProvider(res.data.user.oauth_provider || '');
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('preferred_currency', currency);
      await api.post('/profile', formData);
      setMessageType('success');
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessageType('error');
      setMessage(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <p className="text-sm text-slate-500 dark:text-dark-mute">Sign in to manage your profile.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12 animate-fade-in-up">
      <div className="mb-6 md:mb-8 text-center sm:text-left">
        <h1 className="text-2xl md:text-3xl text-slate-900 dark:text-white mb-2 font-bold tracking-tight">Profile Settings</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-dark-mute">Manage your personal information and account security.</p>
      </div>

      {message && (
        <div className={`mb-6 p-3 rounded-xl text-xs font-medium text-center ${
          messageType === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="card-apple p-0 shadow-lg shadow-slate-200/30 dark:shadow-none border-white/60 dark:border-white/5 overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-slate-100 dark:divide-dark-border/40">
          <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-white dark:border-dark-card shadow-md bg-slate-100 dark:bg-dark-bg flex items-center justify-center">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : user.name ? (
                  <span className="text-3xl font-bold text-primary">
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <User className="w-10 h-10 text-slate-400" />
                )}
              </div>
              {oauthProvider && (
                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white dark:bg-dark-card border-2 border-white dark:border-dark-card flex items-center justify-center shadow-sm">
                  {oauthProvider === 'google' ? (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                  )}
                </div>
              )}
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                {oauthProvider ? `${oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)} Account` : 'Profile Photo'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-dark-mute">
                {avatarUrl
                  ? 'Photo synced from your connected account.'
                  : 'Your initials are used as your avatar.'}
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Full Name</label>
                <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 px-4"
                  required />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Email Address</label>
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 px-4"
                  required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="phone" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Phone Number (Optional)</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full max-w-sm border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 px-4"
                  placeholder="+91 00000 00000" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="preferred_currency" className="block text-xs font-medium text-slate-600 dark:text-slate-300">Preferred Currency</label>
                <select id="preferred_currency" value={currency} onChange={(e) => setCurrency(e.target.value)}
                  className="w-full max-w-sm border border-slate-200 dark:border-dark-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:focus:border-primary-light transition-all text-sm font-medium text-slate-800 dark:text-white bg-slate-50/50 dark:bg-dark-bg/50 py-3 px-4 appearance-none cursor-pointer">
                  {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-dark-mute mt-1">Default currency for new transactions and dashboard display.</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500 dark:text-dark-mute text-center sm:text-left">Changes apply immediately.</p>
            <button type="submit" disabled={saving}
              className="btn-primary w-full sm:w-auto px-8 py-3 md:py-2.5 !rounded-xl disabled:opacity-50 cursor-pointer flex items-center gap-2">
              {saving ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <><Save className="w-4 h-4" /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 md:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 text-sm">
        <Link href="/forgot-password" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
          <Lock className="w-[18px] h-[18px]" />
          Change Password
        </Link>
        <span className="hidden sm:block text-slate-300 dark:text-dark-border">&bull;</span>
        <Link href="/privacy" className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5">
          <Shield className="w-[18px] h-[18px]" />
          Privacy Policy
        </Link>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <ProfileSettings />
        </main>
        <Footer />
      </div>
  );
}
