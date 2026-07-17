'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth, api } from '../../components/AuthContext';
import { Navigation } from '../../components/landing/navigation';
import { FooterSection } from '../../components/landing/footer-section';
import { User, Mail, Phone, Save, Lock, Shield, LogOut } from 'lucide-react';

function ProfileSettings() {
  const { user, loading: authLoading, logout } = useAuth();
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
      await api.post('/api/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
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
        <div className="w-6 h-6 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <main className="bg-background min-h-screen">
        <Navigation />
        <div className="pt-32 max-w-2xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">Sign in to manage your profile.</p>
        </div>
        <FooterSection />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <div className="pt-32 pb-32 md:pb-24 px-4 sm:px-6 lg:px-12 max-w-[1400px] mx-auto has-bottom-nav">
        <div className="w-full max-w-2xl mx-auto">
          <div className="mb-10">
            <span className="inline-flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
              <span className="w-8 h-px bg-foreground/30" />
              Account
            </span>
            <h1 className="text-4xl md:text-5xl font-display tracking-tight leading-[0.95] mb-2">Profile Settings</h1>
            <p className="text-base text-muted-foreground">Manage your personal information and account security.</p>
          </div>

          {message && (
            <div className={`mb-6 p-3 border text-xs font-medium text-center ${
              messageType === 'success'
                ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5'
                : 'border-foreground/10 text-muted-foreground'
            }`}>
              {message}
            </div>
          )}

          <div className="border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-foreground/10">
              <div className="p-8 flex flex-col sm:flex-row items-center gap-6 bg-foreground/[0.02]">
                <div className="relative group">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-foreground/10 bg-foreground/[0.03] flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : user.name ? (
                      <span className="text-3xl font-display text-foreground">
                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </span>
                    ) : (
                      <User className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-base font-medium text-foreground mb-1">
                    {oauthProvider ? `${oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)} Account` : 'Profile Photo'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {avatarUrl ? 'Photo synced from your connected account.' : 'Your initials are used as your avatar.'}
                  </p>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-xs font-medium text-foreground/70">Full Name</label>
                    <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-transparent border border-foreground/10 px-4 py-3 outline-none focus:border-foreground/40 transition-all text-sm text-foreground"
                      required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-xs font-medium text-foreground/70">Email Address</label>
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-transparent border border-foreground/10 px-4 py-3 outline-none focus:border-foreground/40 transition-all text-sm text-foreground"
                      required />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="phone" className="block text-xs font-medium text-foreground/70">Phone Number (Optional)</label>
                    <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full max-w-sm bg-transparent border border-foreground/10 px-4 py-3 outline-none focus:border-foreground/40 transition-all text-sm text-foreground"
                      placeholder="+91 00000 00000" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="preferred_currency" className="block text-xs font-medium text-foreground/70">Preferred Currency</label>
                    <select id="preferred_currency" value={currency} onChange={(e) => setCurrency(e.target.value)}
                      className="w-full max-w-sm bg-transparent border border-foreground/10 px-4 py-3 outline-none focus:border-foreground/40 transition-all text-sm text-foreground appearance-none cursor-pointer">
                      {['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-muted-foreground mt-1">Default currency for new transactions and dashboard display.</p>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-foreground/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-muted-foreground text-center sm:text-left">Changes apply immediately.</p>
                <button type="submit" disabled={saving}
                  className="px-8 py-2.5 text-sm font-medium bg-foreground hover:bg-foreground/90 text-background rounded-full transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2">
                  {saving ? (
                    <span className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin"></span>
                  ) : (
                    <><Save className="w-4 h-4" /> Save Changes</>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm">
            <Link href="/forgot-password" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Lock className="w-[18px] h-[18px]" />
              Change Password
            </Link>
            <span className="hidden sm:block text-foreground/20">&bull;</span>
            <Link href="/privacy" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Shield className="w-[18px] h-[18px]" />
              Privacy Policy
            </Link>
          </div>

          <div className="md:hidden mt-8 flex justify-center">
            <button onClick={logout}
              className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-full transition-all cursor-pointer">
              <LogOut className="w-[18px] h-[18px]" />
              Log Out
            </button>
          </div>
        </div>
      </div>
      <FooterSection />
    </main>
  );
}

export default function ProfilePage() {
  return <ProfileSettings />;
}
