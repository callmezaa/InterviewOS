'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Smartphone, Monitor, Tablet, Globe, Clock, Shield, Loader2, LogOut, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { API_URL } from '../../lib/config';
import { toast } from '../../store/useToastStore';

interface Session {
  id: string;
  deviceName: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  browser: string | null;
  os: string | null;
  ipAddress: string | null;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
}

function DeviceIcon({ type }: { type: Session['deviceType'] }) {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-5 h-5" />;
    case 'tablet':
      return <Tablet className="w-5 h-5" />;
    case 'desktop':
      return <Monitor className="w-5 h-5" />;
    default:
      return <Globe className="w-5 h-5" />;
  }
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function SessionManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = await res.json();
      setSessions(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      toast.error('Failed to Load Sessions', message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevoke = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const res = await fetch(`${API_URL}/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to revoke session');
      }
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      toast.success('Session Revoked', 'The session has been terminated.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      toast.error('Revoke Failed', message);
    } finally {
      setRevoking(null);
    }
  };

  const handleRevokeAll = async () => {
    setRevokingAll(true);
    try {
      const res = await fetch(`${API_URL}/auth/sessions`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || 'Failed to revoke sessions');
      }
      const currentSession = sessions.find((s) => s.isCurrent);
      setSessions(currentSession ? [currentSession] : []);
      toast.success('Sessions Revoked', 'All other sessions have been terminated.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed';
      toast.error('Revoke Failed', message);
    } finally {
      setRevokingAll(false);
    }
  };

  const otherCount = sessions.filter((s) => !s.isCurrent).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h3 className="font-display font-semibold text-[20px] text-white">Active Sessions</h3>
        <p className="text-[12px] text-body-muted/50">
          Manage devices and sessions where you are currently logged in.
        </p>
      </div>

      <Card variant="default" className="p-6 flex flex-col gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-body-muted/40" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-body-muted/50">
            <Shield className="w-8 h-8" />
            <p className="text-[13px]">No active sessions found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {sessions.slice(0, expanded ? sessions.length : 3).map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between gap-4 p-3.5 rounded-lg border transition-colors ${
                    session.isCurrent
                      ? 'bg-primary/[0.04] border-primary/20'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                      session.isCurrent ? 'bg-primary/10 text-primary' : 'bg-white/[0.06] text-body-muted/60'
                    }`}>
                      <DeviceIcon type={session.deviceType} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-medium text-white truncate">
                          {session.deviceName}
                        </span>
                        {session.isCurrent && (
                          <Badge variant="primary" className="text-[10px] px-1.5 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[12px] text-body-muted/50">
                        {session.browser && <span>{session.browser}</span>}
                        {session.os && <span>{session.os}</span>}
                        {session.ipAddress && (
                          <>
                            <span className="text-body-muted/30">&middot;</span>
                            <span>{session.ipAddress}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-body-muted/40">
                        <Clock className="w-3 h-3" />
                        <span>Active {formatTime(session.lastUsedAt)}</span>
                        <span className="text-body-muted/30">&middot;</span>
                        <span>Expires {new Date(session.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  {!session.isCurrent && (
                    <button
                      disabled={revoking === session.id}
                      onClick={() => handleRevoke(session.id)}
                      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] border border-white/[0.08] text-body-muted hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {revoking === session.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogOut className="w-3.5 h-3.5" />
                      )}
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>

            {sessions.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-center gap-1.5 py-2 text-[12px] text-body-muted/50 hover:text-body-muted/80 transition-colors"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    Show {sessions.length - 3} more session{sessions.length - 3 !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            )}

            {otherCount > 0 && (
              <div className="border-t border-white/[0.06] pt-4">
                <button
                  disabled={revokingAll}
                  onClick={handleRevokeAll}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium bg-white/[0.03] border border-white/[0.08] text-danger hover:bg-danger/10 hover:border-danger/20 transition-all disabled:opacity-40 disabled:pointer-events-none"
                >
                  {revokingAll ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Revoke all {otherCount} other session{otherCount !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
