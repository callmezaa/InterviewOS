'use client';

import React, { useState, useCallback } from 'react';
import { Share2, Copy, Check, Loader2, X } from 'lucide-react';
import { API_URL } from '../../lib/config';
import { toast } from '../../store/useToastStore';

interface ShareReviewLinkProps {
  interviewId: string;
}

export function ShareReviewLink({ interviewId }: ShareReviewLinkProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (shareUrl) {
      setOpen((p) => !p);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/interviews/${interviewId}/share`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to generate share link');
      const data = await res.json();
      const url = `${window.location.origin}/review/${interviewId}?token=${data.shareToken}`;
      setShareUrl(url);
      setOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed.';
      toast.error('Share Failed', msg);
    } finally {
      setLoading(false);
    }
  }, [interviewId, shareUrl]);

  const handleCopy = useCallback(() => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link Copied', 'Share link copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  }, [shareUrl]);

  const handleRevoke = useCallback(async () => {
    try {
      await fetch(`${API_URL}/interviews/${interviewId}/share`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setShareUrl(null);
      setOpen(false);
      toast.success('Link Revoked', 'The share link has been disabled.');
    } catch {
      toast.error('Revoke Failed', 'Could not revoke the share link.');
    }
  }, [interviewId]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-body-muted/60 hover:text-white text-[14px] transition-colors border border-white/[0.06] hover:border-white/[0.12] rounded-pill disabled:opacity-40"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Share2 className="w-3.5 h-3.5" />
        )}
        <span>Share Review</span>
      </button>

      {open && shareUrl && (
        <div className="absolute bottom-full left-0 mb-2 w-[360px] bg-surface-tile-2/95 backdrop-blur-md border border-white/[0.08] rounded-xl shadow-[var(--shadow-dropdown-lg)] z-50 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-semibold text-white">Shareable Review Link</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-white/[0.06] text-body-muted/50 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-body-muted/50">
            Anyone with this link can view this interview review — no account required.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[11px] font-mono text-white/70 truncate focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="p-2 rounded-lg bg-primary text-white hover:bg-primary-focus transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleRevoke}
            className="text-[11px] text-danger hover:text-danger/80 transition-colors text-left"
          >
            Revoke link
          </button>
        </div>
      )}
    </div>
  );
}
