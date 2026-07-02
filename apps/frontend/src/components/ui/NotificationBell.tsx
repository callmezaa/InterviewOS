'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Clock, FileText, Send, Users, Megaphone, X } from 'lucide-react';
import { API_URL } from '../../lib/config';
import { useBranding } from '../providers/BrandingProvider';
import { playSound } from '../../lib/sounds';
import { useSoundStore } from '../../store/useSoundStore';
import { useInterviewStore } from '../../store/useInterviewStore';
import { authFetch } from '../../lib/authFetch';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const TYPE_ICONS: Record<string, typeof Bell> = {
  interview_reminder: Clock,
  interview_cancelled: X,
  interview_rescheduled: Clock,
  feedback_ready: FileText,
  interview_invitation: Send,
};

const TYPE_COLORS: Record<string, string> = {
  interview_reminder: 'text-amber-400',
  interview_cancelled: 'text-red-400',
  interview_rescheduled: 'text-sky-400',
  feedback_ready: 'text-emerald-400',
  interview_invitation: 'text-primary',
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);
  const branding = useBranding();
  const user = useInterviewStore((s) => s.user);

  const fetchNotifications = useCallback(async () => {
    if (!user || user.isGuest) return;
    try {
      const [notifsRes, countRes] = await Promise.all([
        authFetch(`${API_URL}/notifications`, {}),
        authFetch(`${API_URL}/notifications/unread-count`, {}),
      ]);
      if (notifsRes.ok) {
        const data = await notifsRes.json();
        setNotifications(data);
      }
      if (countRes.ok) {
        const data = await countRes.json();
        const newCount = data.count as number;
        setUnreadCount((prev) => {
          if (newCount > prevCountRef.current && prevCountRef.current > 0) {
            const { enabled, volume } = useSoundStore.getState();
            if (enabled) playSound('notification', volume);
          }
          prevCountRef.current = newCount;
          return newCount;
        });
      }
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const markAsRead = async (id: string) => {
    try {
      await authFetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllAsRead = async () => {
    setLoading(true);
    try {
      await authFetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
    setLoading(false);
  };

  const handleClick = (notification: Notification) => {
    if (!notification.read) markAsRead(notification.id);
    if (notification.link) {
      window.location.href = notification.link;
    }
    setOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg text-body-muted/60 hover:text-white hover:bg-white/[0.04] transition-all"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger text-[9px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[360px] origin-top-right rounded-xl border border-white/[0.06] bg-surface-tile-2/95 backdrop-blur-md shadow-[var(--shadow-dropdown-lg)] z-[9992] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={loading}
                  className="text-[11px] text-primary hover:text-primary-on-dark transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell className="w-6 h-6 text-body-muted/30 mx-auto mb-2" />
                  <p className="text-[12px] text-body-muted/50">No notifications yet.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const Icon = TYPE_ICONS[notif.type] || Bell;
                  const iconColor = TYPE_COLORS[notif.type] || 'text-body-muted/50';
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-white/[0.04] transition-colors ${
                        notif.read
                          ? 'bg-transparent hover:bg-white/[0.02]'
                          : 'bg-white/[0.02] hover:bg-white/[0.04]'
                      }`}
                    >
                      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] leading-snug ${notif.read ? 'text-body-muted/60' : 'text-white font-medium'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[11px] text-body-muted/40 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-body-muted/30 mt-1 font-mono">
                          {new Date(notif.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
