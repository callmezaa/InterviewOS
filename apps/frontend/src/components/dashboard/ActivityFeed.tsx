'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '../../lib/motion';
import {
  Clock, CalendarPlus, CheckCircle2, Radio, Sparkles, XCircle, CalendarClock,
  UserPlus, RefreshCcw, Link2, LogIn, Loader2, ChevronDown, ExternalLink
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { IllustrationActivity } from '../ui/Illustrations';
import { fetchActivities, type ActivityItem, type ActivityType } from '../../lib/activities';
import { API_URL } from '../../lib/config';
import { useInterviewStore, type InterviewDetails } from '../../store/useInterviewStore';
import { authFetch } from '../../lib/authFetch';

const ICON_MAP: Record<ActivityType, React.ElementType> = {
  interview_scheduled: CalendarPlus,
  interview_active: Radio,
  interview_completed: CheckCircle2,
  interview_cancelled: XCircle,
  interview_rescheduled: RefreshCcw,
  feedback_ready: Sparkles,
  account_created: UserPlus,
  guest_converted: LogIn,
  share_created: Link2,
};

const COLOR_MAP: Record<ActivityType, string> = {
  interview_scheduled: 'text-primary-on-dark',
  interview_active: 'text-yellow-400',
  interview_completed: 'text-green-400',
  interview_cancelled: 'text-red-400',
  interview_rescheduled: 'text-blue-400',
  feedback_ready: 'text-purple-400',
  account_created: 'text-green-400',
  guest_converted: 'text-primary-on-dark',
  share_created: 'text-blue-400',
};

const BG_MAP: Record<ActivityType, string> = {
  interview_scheduled: 'bg-primary/10',
  interview_active: 'bg-yellow-400/10',
  interview_completed: 'bg-green-400/10',
  interview_cancelled: 'bg-red-400/10',
  interview_rescheduled: 'bg-blue-400/10',
  feedback_ready: 'bg-purple-400/10',
  account_created: 'bg-green-400/10',
  guest_converted: 'bg-primary/10',
  share_created: 'bg-blue-400/10',
};

const LABEL_MAP: Record<ActivityType, string> = {
  interview_scheduled: 'Interview scheduled',
  interview_active: 'Interview started',
  interview_completed: 'Interview completed',
  interview_cancelled: 'Interview cancelled',
  interview_rescheduled: 'Interview rescheduled',
  feedback_ready: 'AI feedback generated',
  account_created: 'Account created',
  guest_converted: 'Guest converted to account',
  share_created: 'Review link created',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(Math.abs(diff) / 60000);
  const hours = Math.floor(Math.abs(diff) / 3600000);
  const days = Math.floor(Math.abs(diff) / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type GroupKey = 'today' | 'yesterday' | 'week' | 'earlier';

function getGroupKey(date: Date): GroupKey {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return 'today';
  if (date >= yesterday) return 'yesterday';
  if (date >= weekAgo) return 'week';
  return 'earlier';
}

const GROUP_LABELS: Record<GroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This Week',
  earlier: 'Earlier',
};

interface ActivityFeedProps {
  interviews: InterviewDetails[];
}

export function ActivityFeed({ interviews }: ActivityFeedProps) {
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const user = useInterviewStore((s) => s.user);

  const loadActivities = useCallback(async (pageNum: number, append = false) => {
    if (!user || user.isGuest) return;
    const controller = new AbortController();
    abortRef.current = controller;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);
    try {
      const result = await fetchActivities({
        page: pageNum,
        limit: 15,
      });
      if (append) {
        setActivities((prev) => [...prev, ...result.data]);
      } else {
        setActivities(result.data);
      }
      setHasMore(result.hasMore);
      setPage(pageNum);
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') {
        setError(err instanceof Error ? err.message : 'Failed to load');
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user]);

  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!user || user.isGuest || fetchedRef.current) return;
    fetchedRef.current = true;
    loadActivities(1);

    return () => {
      abortRef.current?.abort();
    };
  }, [loadActivities, user]);

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadActivities(page + 1, true);
    }
  };

  // Group activities by date
  const grouped = React.useMemo(() => {
    const groups = new Map<GroupKey, ActivityItem[]>();
    for (const item of activities) {
      const key = getGroupKey(new Date(item.createdAt));
      const arr = groups.get(key) || [];
      arr.push(item);
      groups.set(key, arr);
    }
    return groups;
  }, [activities]);

  const handleItemClick = (item: ActivityItem) => {
    if (item.interview?.id) {
      const path = item.type === 'feedback_ready'
        ? `/review/${item.interview.id}`
        : `/interview/${item.interview.id}`;
      router.push(path);
    }
  };

  return (
    <Card variant="ghost" className="p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3.5">
        <Clock className="w-4 h-4 text-white/55" />
        <h3 className="font-display font-semibold text-[15px] tracking-tight text-white/80">
          Activity
        </h3>
        {!loading && (
          <span className="ml-auto text-[11px] text-white/20 font-mono">
            {activities.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-white/20" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-[13px] text-red-400/70">{error}</p>
          <button
            onClick={() => loadActivities(1)}
            className="text-[12px] text-primary hover:text-primary-on-dark transition-colors"
          >
            Try again
          </button>
        </div>
      ) : activities.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-3 py-10 text-center"
        >
          <div className="w-[100px] h-[80px] text-white/15 select-none pointer-events-none">
            <IllustrationActivity className="w-full h-full" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[15px] font-display font-semibold text-white/50 tracking-tight">
              No activity yet
            </p>
            <p className="text-[12px] text-body-muted/50 max-w-[200px] leading-relaxed">
              Your interview activity will appear here once you schedule or join sessions.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4">
          {(['today', 'yesterday', 'week', 'earlier'] as GroupKey[]).map((groupKey) => {
            const items = grouped.get(groupKey);
            if (!items || items.length === 0) return null;
            return (
              <div key={groupKey}>
                <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-1 mb-2">
                  {GROUP_LABELS[groupKey]}
                </p>
                <motion.div
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col"
                  role="list"
                >
                  {items.map((item, idx) => {
                    const Icon = ICON_MAP[item.type];
                    const color = COLOR_MAP[item.type];
                    const bg = BG_MAP[item.type];
                    const isClickable = !!item.interview;

                    return (
                      <motion.div
                        key={item.id}
                        variants={staggerItem}
                        onClick={() => isClickable && handleItemClick(item)}
                        className={`relative flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                          isClickable
                            ? 'hover:bg-white/[0.03] cursor-pointer'
                            : ''
                        }`}
                        role="listitem"
                        aria-label={`${LABEL_MAP[item.type]}: ${item.title}`}
                      >
                        {/* Timeline line */}
                        {idx < items.length - 1 && (
                          <div className="absolute left-[21px] top-8 bottom-0 w-px bg-white/[0.06]" />
                        )}

                        <div className={`shrink-0 mt-0.5 w-7 h-7 rounded-lg ${bg} flex items-center justify-center ${color}`} aria-hidden="true">
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[13px] text-white/70 leading-snug truncate">
                              {LABEL_MAP[item.type]}
                            </p>
                            {isClickable && (
                              <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                            )}
                          </div>
                          <p className="text-[12px] text-white/50 truncate mt-0.5">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-white/30 truncate mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <span
                          className="shrink-0 text-[11px] text-white/20 font-mono mt-0.5 group-hover:text-white/55 transition-colors"
                          aria-label={timeAgo(item.createdAt)}
                        >
                          {timeAgo(item.createdAt)}
                        </span>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            );
          })}

          {hasMore && (
            <div className="flex justify-center pt-1">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white/40 hover:text-white/70 hover:bg-white/[0.04] transition-colors disabled:opacity-40"
              >
                {loadingMore ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                Load more
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
