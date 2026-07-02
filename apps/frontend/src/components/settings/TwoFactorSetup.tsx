'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, ShieldOff, Loader2, Copy, Download, CheckCircle, XCircle,
  ArrowLeft, KeyRound,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { API_URL } from '../../lib/config';
import { useInterviewStore } from '../../store/useInterviewStore';
import { toast } from '../../store/useToastStore';

type SetupStep = 'idle' | 'qr' | 'verify' | 'backup';

export default function TwoFactorSetup() {
  const { user, setUser } = useInterviewStore();
  const enabled = user?.twoFactorEnabled ?? false;

  const [step, setStep] = useState<SetupStep>('idle');
  const [loading, setLoading] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    uri: string;
    backupCodes: string[];
  } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  const handleStartSetup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/2fa/setup`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to start 2FA setup');
      }
      const data = await res.json();
      setSetupData(data);
      setStep('qr');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Setup Failed', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (verifyCode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: verifyCode }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Invalid code');
      }
      setStep('backup');
      if (user) setUser({ ...user, twoFactorEnabled: true });
      toast.success('2FA Enabled', 'Two-factor authentication is now active.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Verification Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [verifyCode, user, setUser]);

  const handleDisable = useCallback(async () => {
    setDisabling(true);
    try {
      const res = await fetch(`${API_URL}/auth/2fa/disable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to disable 2FA');
      }
      if (user) setUser({ ...user, twoFactorEnabled: false });
      toast.success('2FA Disabled', 'Two-factor authentication has been turned off.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Disable Failed', msg);
    } finally {
      setDisabling(false);
    }
  }, [user, setUser]);

  const handleRegenerateBackup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/2fa/backup-codes`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to regenerate codes');
      const data = await res.json();
      setSetupData((prev) => prev ? { ...prev, backupCodes: data.backupCodes } : null);
      setStep('backup');
      toast.success('Backup Codes Regenerated', 'Store these new codes in a safe place.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Regeneration Failed', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCopySecret = useCallback(() => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    toast.success('Copied', 'Secret key copied to clipboard.');
  }, [setupData]);

  const handleDownloadCodes = useCallback(() => {
    if (!setupData?.backupCodes?.length) return;
    const content = [
      'InterviewOS — Two-Factor Authentication Backup Codes',
      `Generated: ${new Date().toISOString()}`,
      '',
      'Each code can only be used once. Store these codes in a safe place.',
      '',
      ...setupData.backupCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interviewos-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [setupData]);

  const handleDone = useCallback(() => {
    setStep('idle');
    setSetupData(null);
    setVerifyCode('');
  }, []);

  // ── Idle state ────────────────────────────────────────────

  if (step === 'idle' && !enabled) {
    return (
      <Card variant="default" className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center shrink-0">
            <ShieldOff className="w-4 h-4 text-body-muted/50" />
          </div>
          <div>
            <h4 className="font-semibold text-[14px] text-white">Two-Factor Authentication</h4>
            <p className="text-[12px] text-body-muted/55 mt-0.5 max-w-[320px] leading-relaxed">
              Add an extra layer of security by requiring a code from your authenticator app when signing in.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="primary"
          disabled={loading}
          onClick={handleStartSetup}
          className="px-5 py-2 flex items-center gap-1.5 shrink-0"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          <span>Enable 2FA</span>
        </Button>
      </Card>
    );
  }

  if (step === 'idle' && enabled) {
    return (
      <Card variant="default" className="p-6 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-success" />
            </div>
            <div>
              <h4 className="font-semibold text-[14px] text-white">Two-Factor Authentication</h4>
              <p className="text-[12px] text-success/70 mt-0.5">Enabled — your account is protected.</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            disabled={disabling}
            onClick={handleDisable}
            className="px-4 py-2 flex items-center gap-1.5 border border-white/[0.06] text-danger hover:bg-danger/10 shrink-0"
          >
            {disabling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
            <span>Disable 2FA</span>
          </Button>
        </div>

        <div className="border-t border-white/[0.06] pt-4">
          <p className="text-[12px] text-body-muted/50 mb-3">Lost your authenticator? Generate new backup codes.</p>
          <Button
            type="button"
            variant="ghost"
            disabled={loading}
            onClick={handleRegenerateBackup}
            className="px-4 py-2 flex items-center gap-1.5 border border-white/[0.06]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>Regenerate Backup Codes</span>
          </Button>
        </div>
      </Card>
    );
  }

  // ── QR Code Step ──────────────────────────────────────────

  if (step === 'qr' && setupData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card variant="default" className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { setStep('idle'); setSetupData(null); }}
              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-body-muted/60" />
            </button>
            <div>
              <h4 className="font-semibold text-[14px] text-white">Scan QR Code</h4>
              <p className="text-[12px] text-body-muted/55">Open your authenticator app and scan this code.</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="p-3 bg-white rounded-xl">
              <img src={setupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
            </div>

            <div className="flex flex-col items-center gap-1.5 w-full">
              <p className="text-[11px] text-body-muted/40 uppercase tracking-wider font-semibold">Manual entry key</p>
              <div className="flex items-center gap-2">
                <code className="px-3 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-[13px] font-mono text-white/80 tracking-wider">
                  {setupData.secret}
                </code>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:bg-white/[0.08] transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-body-muted/50" />}
                </button>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={() => setStep('verify')}
            className="w-full py-2.5 mt-2"
          >
            I&apos;ve scanned the QR code
          </Button>
        </Card>
      </motion.div>
    );
  }

  // ── Verify Step ───────────────────────────────────────────

  if (step === 'verify') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card variant="default" className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep('qr')}
              className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center hover:bg-white/[0.06] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-body-muted/60" />
            </button>
            <div>
              <h4 className="font-semibold text-[14px] text-white">Verify Code</h4>
              <p className="text-[12px] text-body-muted/55">Enter the 6-digit code from your authenticator app.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-center gap-2">
              <input
                type="text"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                autoFocus
                className="w-48 h-14 text-center text-[28px] font-mono font-semibold tracking-[0.5em] bg-white/[0.04] border border-white/[0.08] rounded-xl text-white/90 outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 placeholder:text-body-muted/30 transition-all"
              />
            </div>

            <Button
              type="button"
              variant="primary"
              disabled={verifyCode.length !== 6 || loading}
              onClick={handleVerify}
              className="w-full py-2.5 flex items-center justify-center gap-1.5"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Verify & Enable</span>
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ── Backup Codes Step ─────────────────────────────────────

  if (step === 'backup' && setupData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card variant="default" className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-success/10 border border-success/20 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 text-success" />
            </div>
            <div>
              <h4 className="font-semibold text-[14px] text-white">Save Backup Codes</h4>
              <p className="text-[12px] text-body-muted/55">
                Each code works once. Store them somewhere safe — you&apos;ll need them if you lose access to your authenticator.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl">
            {setupData.backupCodes.map((code, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] rounded-lg">
                <span className="text-[11px] text-body-muted/40 font-mono w-5 text-right">{i + 1}.</span>
                <code className="text-[13px] font-mono text-white/80 tracking-wider">{code}</code>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDownloadCodes}
              className="flex-1 py-2 flex items-center justify-center gap-1.5 border border-white/[0.06]"
            >
              <Download className="w-4 h-4" />
              <span>Download Codes</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleDone}
              className="flex-1 py-2"
            >
              Done
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  return null;
}
