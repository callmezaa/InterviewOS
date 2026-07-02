'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '../ui/Card';
import {
  Send, Clock, FileText, Users, Megaphone, Sparkles, Loader2, AlertCircle,
} from 'lucide-react';
import { API_URL } from '../../lib/config';
import { toast } from '../../store/useToastStore';

type NotifCategory = 'invitations' | 'reminders' | 'feedback' | 'team' | 'updates';
type DigestMode = 'immediate' | 'daily' | 'weekly';

interface Prefs {
  invitations: boolean;
  reminders: boolean;
  feedback: boolean;
  team: boolean;
  updates: boolean;
  digest: DigestMode;
}

const defaultPrefs: Prefs = {
  invitations: true,
  reminders: true,
  feedback: true,
  team: false,
  updates: false,
  digest: 'immediate',
};

const CATEGORIES: { id: NotifCategory; label: string; desc: string; icon: React.ElementType }[] = [
  { id: 'invitations', label: 'Session Invitations', desc: 'When you\'re invited to an interview or schedule details change.', icon: Send },
  { id: 'reminders', label: 'Interview Reminders', desc: 'Before a scheduled interview begins.', icon: Clock },
  { id: 'feedback', label: 'Feedback & Results', desc: 'When AI evaluation or interview feedback is ready.', icon: FileText },
  { id: 'team', label: 'Team Activity', desc: 'When team members schedule, complete, or update interviews.', icon: Users },
  { id: 'updates', label: 'System Updates', desc: 'Product announcements, maintenance notices, and new features.', icon: Megaphone },
];

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primary/50 disabled:opacity-40 disabled:cursor-not-allowed ${
        checked ? 'bg-primary' : 'bg-white/10'
      }`}
    >
      <div
        className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export default function EmailPreferences() {
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [masterOn, setMasterOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<Prefs>(defaultPrefs);

  // Fetch preferences on mount
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`${API_URL}/notifications/preferences`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load preferences');
        return res.json() as Promise<Prefs>;
      })
      .then((data) => {
        if (cancelled) return;
        const merged: Prefs = { ...defaultPrefs, ...data };
        setPrefs(merged);
        latestRef.current = merged;
        setMasterOn(
          merged.invitations || merged.reminders || merged.feedback || merged.team || merged.updates
        );
      })
      .catch(() => {
        if (!cancelled) setError('Could not load preferences. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const savePrefs = useCallback(async (p: Prefs) => {
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/notifications/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(p),
      });
      if (!res.ok) throw new Error('Save failed');
    } catch {
      toast.error('Save Failed', 'Could not save notification preferences.');
    } finally {
      setSaving(false);
    }
  }, []);

  const queueSave = useCallback((p: Prefs) => {
    latestRef.current = p;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      savePrefs(latestRef.current);
    }, 600);
  }, [savePrefs]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const toggleCategory = (id: NotifCategory) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    queueSave(next);
  };

  const toggleMaster = () => {
    const newVal = !masterOn;
    setMasterOn(newVal);
    const next: Prefs = {
      ...prefs,
      invitations: newVal,
      reminders: newVal,
      feedback: newVal,
      team: false,
      updates: false,
    };
    setPrefs(next);
    queueSave(next);
  };

  const setDigest = (digest: DigestMode) => {
    const next = { ...prefs, digest };
    setPrefs(next);
    queueSave(next);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 text-body-muted/40 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <AlertCircle className="w-6 h-6 text-danger" />
        <p className="text-[13px] text-body-muted/60">{error}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="text-[12px] text-primary hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  const anyEnabled = prefs.invitations || prefs.reminders || prefs.feedback || prefs.team || prefs.updates;

  return (
    <div className="flex flex-col gap-4">
      {/* Digest Frequency */}
      <Card variant="default" className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-primary-on-dark" />
          </div>
          <div>
            <h4 className="font-semibold text-[14px] text-white">Digest Frequency</h4>
            <p className="text-[12px] text-body-muted/55 mt-0.5">Bundle non-urgent notifications into a single digest.</p>
          </div>
        </div>
        <div className="flex gap-1.5 bg-white/[0.03] rounded-lg p-1 border border-white/[0.06]">
          {(['immediate', 'daily', 'weekly'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setDigest(opt)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-semibold font-mono transition-all ${
                prefs.digest === opt
                  ? 'bg-primary text-white'
                  : 'text-body-muted/50 hover:text-white'
              }`}
            >
              {opt.charAt(0).toUpperCase() + opt.slice(1)}
            </button>
          ))}
        </div>
      </Card>

      {/* Global Master Toggle */}
      <Card variant="default" className="p-5 flex items-center justify-between">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
            <Megaphone className="w-4 h-4 text-body-muted/60" />
          </div>
          <div>
            <h4 className="font-semibold text-[14px] text-white">Email Notifications</h4>
            <p className="text-[12px] text-body-muted/55 mt-0.5">
              {anyEnabled
                ? 'Receiving emails for selected categories.'
                : 'All email notifications are paused.'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {saving && <Loader2 className="w-3.5 h-3.5 text-body-muted/40 animate-spin" />}
          <Toggle
            checked={anyEnabled}
            onChange={toggleMaster}
            label="Toggle all email notifications"
          />
        </div>
      </Card>

      {/* Category Toggles */}
      <Card variant="default" className="divide-y divide-white/[0.04]">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.015] transition-colors">
              <div className="flex-1 flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-body-muted/60" />
                </div>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-white">{cat.label}</p>
                  <p className="text-[11px] text-body-muted/50 mt-0.5 leading-relaxed">{cat.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-body-muted/40 font-semibold uppercase tracking-wider">
                  Email
                </span>
                <Toggle
                  checked={prefs[cat.id]}
                  onChange={() => toggleCategory(cat.id)}
                  label={`Email notifications for ${cat.label}`}
                />
              </div>
            </div>
          );
        })}
      </Card>

      {/* Saving indicator */}
      {saving && (
        <p className="text-[11px] text-body-muted/40 flex items-center gap-1.5 justify-end">
          <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
          Saving changes...
        </p>
      )}
    </div>
  );
}
