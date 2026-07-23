'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInterviewStore } from '../../store/useInterviewStore';
import { toast } from '../../store/useToastStore';
import { useActionHistory } from '../../store/useActionHistoryStore';
import { Header } from '../../components/ui/Header';
import { SettingsSkeleton } from '../../components/ui/SettingsSkeleton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PasswordField } from '../../components/auth/PasswordField';
import EmailPreferences from '../../components/settings/EmailPreferences';
import SoundSettings from '../../components/settings/SoundSettings';
import AvatarUpload from '../../components/settings/AvatarUpload';
import DataExport from '../../components/settings/DataExport';
import TwoFactorSetup from '../../components/settings/TwoFactorSetup';
import SessionManagement from '../../components/settings/SessionManagement';
import ThemeBuilder from '../../components/settings/ThemeBuilder';
import { IntegrationSettings } from '../../components/settings/IntegrationSettings';
import { useShortcuts } from '../../hooks/useShortcuts';
import { 
  User, Mail, Globe, Bell, Save, ArrowLeft, Check, Loader2, Shield, Lock,
  Sparkles, Palette, Terminal, Plug, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../../lib/config';
import type { ThemeConfig } from '@interviewos/shared';

export default function SettingsPage() {
  const router = useRouter();
  const { user, setUser } = useInterviewStore();

  // Settings States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<'javascript' | 'python' | 'typescript'>('javascript');
  
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'notifications' | 'branding' | 'security' | 'sessions' | 'integrations'>('profile');

  // ── Command Palette action dispatcher ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      switch (action) {
        case 'settings-profile':
          setActiveTab('profile');
          break;
        case 'settings-language':
          setActiveTab('preferences');
          break;
        case 'settings-notifications':
          setActiveTab('notifications');
          break;
        case 'save-settings':
          document.querySelector('form')?.requestSubmit();
          break;
      }
    };
    window.addEventListener('cmdk:action', handler);
    return () => window.removeEventListener('cmdk:action', handler);
  }, []);

  // Sync settings with store
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    
    // Load local storage preferences if present
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('pref_lang');
      if (savedLang === 'javascript' || savedLang === 'python' || savedLang === 'typescript') {
        setDefaultLanguage(savedLang);
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!name.trim()) {
      toast.error('Invalid Name', 'Profile name cannot be left empty.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    // Snapshot previous values for undo
    const prevName = user.name;
    const prevEmail = user.email;
    const prevLang = typeof window !== 'undefined' ? localStorage.getItem('pref_lang') : null;

    setIsSaving(true);

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save profile');
      }

      // Update store with server response
      setUser({
        ...user,
        name: data.name ?? user.name,
        email: data.email ?? user.email,
      });

      // Persist local settings
      if (typeof window !== 'undefined') {
        localStorage.setItem('pref_lang', defaultLanguage);
      }

      setIsSaving(false);
      useActionHistory.getState().pushAction({
        type: 'settings:updated',
        label: 'Settings saved',
        description: 'Profile and preferences updated.',
        undo: async () => {
          const res = await fetch(`${API_URL}/auth/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name: prevName, email: prevEmail }),
          });
          if (!res.ok) throw new Error('Undo failed');
          const d = await res.json();
          setUser({ ...user, name: d.name, email: d.email });
          if (typeof window !== 'undefined') {
            if (prevLang) localStorage.setItem('pref_lang', prevLang);
            else localStorage.removeItem('pref_lang');
          }
          setName(prevName);
          setEmail(prevEmail);
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      setIsSaving(false);
      toast.error('Save Failed', message);
    }
  };

  useShortcuts([
    {
      def: { id: 'set-save', key: 's', meta: true, label: '', description: '', category: '', scope: 'settings' },
      handler: () => document.querySelector('form')?.requestSubmit(),
    },
  ], !!user);

  if (!user) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="flex-1 flex flex-col bg-surface-black text-white min-h-screen">
      {/* App Header */}
      <Header subTitle="Account Settings" />

      {/* Main Settings Body */}
      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-[240px] shrink-0 flex flex-col gap-6 select-none">
          {/* Back button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-[12px] font-semibold text-body-muted/60 hover:text-white transition-all self-start group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Dashboard</span>
          </button>

          {/* Settings Tabs Card */}
          <Card variant="default" className="p-2 border border-white/[0.06] bg-surface-tile-2/40 flex flex-col gap-1 rounded-lg">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'profile'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('preferences')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'preferences'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Language Prefs</span>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'notifications'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'branding'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Branding</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'security'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </button>

            <button
              onClick={() => setActiveTab('sessions')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'sessions'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Sessions</span>
            </button>

            <button
              onClick={() => setActiveTab('integrations')}
              className={`w-full px-3.5 py-2.5 rounded-lg text-[13px] font-medium flex items-center gap-2.5 transition-all ${
                activeTab === 'integrations'
                  ? 'bg-primary text-white font-semibold'
                  : 'text-body-muted/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <Plug className="w-4 h-4" />
              <span>Integrations</span>
            </button>
          </Card>
        </aside>

        {/* Right Tab Content */}
        <section className="flex-1 min-w-0">
          <form onSubmit={handleSave} className="flex flex-col gap-6">
            
            <AnimatePresence mode="wait">
              {/* profile Tab */}
              {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-display font-semibold text-[20px] text-white">Profile Credentials</h3>
                  <p className="text-[12px] text-body-muted/50">Update your core personal credentials and email communications.</p>
                </div>

                {/* Avatar Upload */}
                <Card variant="default" className="p-6">
                  <AvatarUpload />
                </Card>

                <Card variant="default" className="p-6 flex flex-col gap-5">
                  {/* Name field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-body-muted/70" htmlFor="profile-name">
                      Full Name
                    </label>
                    <Input
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      icon={User}
                    />
                  </div>

                  {/* Email field */}
                  <div className="flex flex-col gap-2">
                    <label className="text-[12px] font-semibold text-body-muted/70" htmlFor="profile-email">
                      Email Address
                    </label>
                    <Input
                      id="profile-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      icon={Mail}
                    />
                  </div>

                </Card>
              </motion.div>
            )}

            {/* preferences Tab */}
            {activeTab === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-display font-semibold text-[20px] text-white">Default Languages</h3>
                  <p className="text-[12px] text-body-muted/50">Select your preferred compiler code sandboxes for faster room initialization.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* JavaScript */}
                  <Card
                    onClick={() => setDefaultLanguage('javascript')}
                    variant="interactive"
                    className={`flex flex-col gap-3 relative ${
                      defaultLanguage === 'javascript'
                        ? 'border-primary bg-primary/5 shadow-[0_0_20px_-6px_rgba(41,151,255,0.2)]'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-mono text-white font-semibold bg-white/[0.06] border border-white/[0.1] px-2 py-0.5 rounded">JS</span>
                      {defaultLanguage === 'javascript' && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[15px] text-white">JavaScript</h4>
                      <p className="text-[11px] text-body-muted/55 mt-1">Lightweight, v20.17 Node.js environment compiler.</p>
                    </div>
                  </Card>

                  {/* TypeScript */}
                  <Card
                    onClick={() => setDefaultLanguage('typescript')}
                    variant="interactive"
                    className={`flex flex-col gap-3 relative ${
                      defaultLanguage === 'typescript'
                        ? 'border-primary bg-primary/5 shadow-[0_0_20px_-6px_rgba(41,151,255,0.2)]'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-mono text-primary-on-dark font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">TS</span>
                      {defaultLanguage === 'typescript' && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[15px] text-white">TypeScript</h4>
                      <p className="text-[11px] text-body-muted/55 mt-1">Robust, structured static v5.6 code execution.</p>
                    </div>
                  </Card>

                  {/* Python */}
                  <Card
                    onClick={() => setDefaultLanguage('python')}
                    variant="interactive"
                    className={`flex flex-col gap-3 relative ${
                      defaultLanguage === 'python'
                        ? 'border-primary bg-primary/5 shadow-[0_0_20px_-6px_rgba(41,151,255,0.2)]'
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[12px] font-mono text-white/60 font-semibold bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">PY</span>
                      {defaultLanguage === 'python' && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[15px] text-white">Python</h4>
                      <p className="text-[11px] text-body-muted/55 mt-1">Premium standard v3.13 data structure processing.</p>
                    </div>
                  </Card>
                </div>
              </motion.div>
            )}

            {/* notifications Tab */}
            {activeTab === 'notifications' && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="font-display font-semibold text-[20px] text-white">Notification Preferences</h3>
                  <p className="text-[12px] text-body-muted/50">Control how email notifications are delivered across different categories.</p>
                </div>

                <SoundSettings />

                <EmailPreferences />
              </motion.div>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <BrandingTab />
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <SecurityTab />
            )}

            {/* Sessions Tab */}
            {activeTab === 'sessions' && (
              <motion.div
                key="sessions"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <SessionManagement />
              </motion.div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <IntegrationSettings />
            )}
            </AnimatePresence>

            {activeTab !== 'security' && activeTab !== 'sessions' && activeTab !== 'integrations' && (
              <div className="flex items-center justify-end mt-4 border-t border-white/[0.06] pt-6 gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/dashboard')}
                  className="px-4 py-2 border border-white/[0.06] rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="px-5 py-2 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSaving ? 'Synchronizing...' : 'Save Settings'}</span>
                </Button>
              </div>
            )}

          </form>
        </section>

      </main>
    </div>
  );
}

/* ── Branding Tab ─────────────────────────────────────────── */

function BrandingTab() {
  const { user, setUser } = useInterviewStore();
  const branding = user?.branding;

  const [brandName, setBrandName] = useState(branding?.name || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(branding?.logoUrl || '');
  const [brandColor, setBrandColor] = useState(branding?.primaryColor || '#0066cc');
  const [brandTheme, setBrandTheme] = useState<ThemeConfig | null>(branding?.theme ?? null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const prevBranding = branding;
    try {
      const res = await fetch(`${API_URL}/branding`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: brandName || undefined,
          logoUrl: brandLogoUrl || null,
          primaryColor: brandColor,
          theme: brandTheme,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update branding');
      }
      const data = await res.json();
      if (user) {
        setUser({ ...user, branding: data });
      }
      useActionHistory.getState().pushAction({
        type: 'branding:updated',
        label: 'Branding updated',
        description: 'Your brand settings have been saved.',
        undo: async () => {
          const res = await fetch(`${API_URL}/branding`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: prevBranding?.name || undefined,
              logoUrl: prevBranding?.logoUrl || null,
              primaryColor: prevBranding?.primaryColor || '#0066cc',
              theme: prevBranding?.theme ?? null,
            }),
          });
          if (!res.ok) throw new Error('Undo failed');
          const data = await res.json();
          if (user) setUser({ ...user, branding: data });
        },
      });
    } catch (e: any) {
      toast.error('Save failed', e.message || 'Could not update branding.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Brand Identity */}
      <Card variant="default" className="p-6 border border-white/[0.06]">
        <div className="flex flex-col gap-5">
          <div>
            <h3 className="text-[15px] font-semibold text-white mb-1">Brand Identity</h3>
            <p className="text-[12px] text-body-muted/50">Customize how your interview platform appears to candidates and team members.</p>
          </div>

          {/* Preview */}
          <div className="p-4 rounded-lg border border-white/[0.06] bg-white/[0.02]">
            <span className="text-[10px] text-body-muted/40 font-mono mb-2 block">Preview</span>
            <div className="flex items-center gap-2">
              {brandLogoUrl ? (
                <img src={brandLogoUrl} alt={brandName} className="w-6 h-6 object-contain rounded" />
              ) : (
                <div className="w-6 h-6 rounded flex items-center justify-center" style={{ backgroundColor: brandColor + '15', border: `1px solid ${brandColor}30` }}>
                  <Terminal className="w-3.5 h-3.5" style={{ color: brandColor }} />
                </div>
              )}
              <span className="font-display font-semibold text-[14px] text-white">{brandName || 'Your Company'}</span>
            </div>
          </div>

          {/* Company Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Company Name</label>
            <Input
              type="text"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="e.g. Acme Corp"
              maxLength={100}
            />
          </div>

          {/* Logo URL */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Logo URL</label>
            <Input
              type="url"
              value={brandLogoUrl}
              onChange={(e) => setBrandLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.svg"
            />
            <span className="text-[10px] text-body-muted/40">PNG, SVG, or WebP. Recommended: 64x64px or larger.</span>
          </div>

          {/* Primary Color */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-body-muted/60 font-mono font-semibold">Accent Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => {
                  setBrandColor(e.target.value);
                  if (brandTheme) {
                    setBrandTheme({
                      ...brandTheme,
                      colors: { ...brandTheme.colors, primary: e.target.value },
                    });
                  }
                }}
                className="w-10 h-10 rounded-lg border border-white/[0.06] bg-transparent cursor-pointer"
                title="Pick accent color"
              />
              <Input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#0066cc"
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Theme Builder */}
      <Card variant="default" className="p-6 border border-white/[0.06]">
        <ThemeBuilder
          value={brandTheme}
          onChange={(theme) => {
            setBrandTheme(theme);
            if (theme.colors.primary !== brandColor) {
              setBrandColor(theme.colors.primary);
            }
          }}
          disabled={saving}
        />
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {saving ? 'Saving...' : 'Save Brand & Theme'}
      </Button>
    </motion.div>
  );
}

/* ── Security Tab ─────────────────────────────────────────── */

function SecurityTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Validation Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      toast.error('Validation Error', 'New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Validation Error', 'New passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      toast.success('Password Updated', 'Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Update Failed', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      key="security"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display font-semibold text-[20px] text-white">Security</h3>
        <p className="text-[12px] text-body-muted/50">Update your password and secure your account.</p>
      </div>

      <Card variant="default" className="p-6 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-body-muted/70" htmlFor="current-password">
            Current Password
          </label>
          <PasswordField
            id="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            autoComplete="current-password"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-body-muted/70" htmlFor="new-password">
            New Password
          </label>
          <PasswordField
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            autoComplete="new-password"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[12px] font-semibold text-body-muted/70" htmlFor="confirm-password">
            Confirm New Password
          </label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            icon={Lock}
          />
          {confirmPassword && newPassword !== confirmPassword && (
            <span className="text-[11px] text-red-400/70 mt-1">Passwords do not match</span>
          )}
        </div>

        <div className="border-t border-white/[0.06] pt-5 mt-2">
          <Button
            type="button"
            variant="primary"
            disabled={saving}
            onClick={handleChangePassword}
            className="px-5 py-2 flex items-center gap-1.5"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            <span>{saving ? 'Updating...' : 'Change Password'}</span>
          </Button>
        </div>
      </Card>

      <TwoFactorSetup />

      <DataExport />
    </motion.div>
  );
}

/* ── Toggle Switch ─────────────────────────────────────────── */


