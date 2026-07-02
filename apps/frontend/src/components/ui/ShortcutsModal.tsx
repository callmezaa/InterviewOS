'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { getShortcutsForScope, formatShortcut, SHORTCUTS } from '../../lib/shortcuts';
import type { ShortcutDef } from '../../lib/shortcuts';

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[22px] h-[20px] px-1.5 text-[10px] font-semibold leading-none text-white/60 bg-white/[0.07] border border-white/[0.1] rounded font-sans tracking-tight">
      {children}
    </kbd>
  );
}

function Chord({ def }: { def: ShortcutDef }) {
  const chord = formatShortcut(def);
  const parts: string[] = [];
  let buf = '';
  for (const ch of chord) {
    if (ch === '\u2318' || ch === '\u21E7' || ch === '\u2303' || ch === '\u2325') {
      if (buf) parts.push(buf);
      parts.push(ch);
      buf = '';
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);

  return (
    <span className="flex items-center gap-0.5">
      {parts.map((part, i) => (
        <Key key={i}>{part === '\u2318' ? '\u2318' : part === '\u21E7' ? '\u21E7' : part === '\u2303' ? '\u2303' : part === '\u2325' ? '\u2325' : part}</Key>
      ))}
    </span>
  );
}

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const pathname = usePathname();

  const close = useCallback(() => { setOpen(false); setQuery(''); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isTyping =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.getAttribute('contenteditable') === 'true');

      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === 'Escape' && open) {
        e.preventDefault();
        setOpen(false);
        setQuery('');
      }
    };
    const toggleHandler = () => setOpen((prev) => !prev);
    const cmdkHandler = (e: Event) => {
      const action = (e as CustomEvent).detail as string;
      if (action === 'toggle-shortcuts') setOpen((prev) => !prev);
    };

    document.addEventListener('keydown', handler);
    window.addEventListener('shortcuts:toggle', toggleHandler);
    window.addEventListener('cmdk:action', cmdkHandler);
    return () => {
      document.removeEventListener('keydown', handler);
      window.removeEventListener('shortcuts:toggle', toggleHandler);
      window.removeEventListener('cmdk:action', cmdkHandler);
    };
  }, [open]);

  const scope = pathname.startsWith('/interview/')
    ? 'interview'
    : pathname.startsWith('/settings')
      ? 'settings'
      : 'dashboard';

  const groups = useMemo(() => {
    const all = getShortcutsForScope(scope);
    const visible = all.filter((s) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        s.description.toLowerCase().includes(q) ||
        s.label.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        formatShortcut(s).toLowerCase().includes(q)
      );
    });

    const grouped = new Map<string, ShortcutDef[]>();
    for (const s of visible) {
      const list = grouped.get(s.category) ?? [];
      list.push(s);
      grouped.set(s.category, list);
    }

    const order = ['Global', 'Dashboard', 'Interview Room', 'Settings'];
    return Array.from(grouped.entries()).sort(
      (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
    );
  }, [scope, query]);

  const count = SHORTCUTS.length;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -12 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            className="relative w-full max-w-[520px] bg-surface-tile-2/95 backdrop-blur-xl border border-white/[0.06] rounded-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <h2 id="shortcuts-title" className="text-[15px] font-semibold text-white/90 tracking-tight">
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                onClick={close}
                className="p-1 rounded-md text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
                aria-label="Close shortcuts"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2.5 px-4 border-b border-white/[0.06]">
              <Search className="w-3.5 h-3.5 text-white/20 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${count} shortcuts...`}
                className="w-full bg-transparent text-[13px] text-white/70 placeholder-white/20 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary/40"
                autoFocus
              />
            </div>

            {/* Shortcut list */}
            <div className="px-2 py-2 max-h-[55vh] overflow-y-auto">
              {groups.length === 0 && (
                <div className="py-8 text-center text-[13px] text-white/25">
                  No shortcuts for &ldquo;{query}&rdquo;
                </div>
              )}

              {groups.map(([category, items]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <h3 className="text-[10px] font-semibold tracking-wider text-white/25 uppercase px-3 py-1.5">
                    {category}
                  </h3>
                  <div className="space-y-0.5">
                    {items.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
                      >
                        <span className="text-[13px] text-white/70 leading-snug group-hover:text-white/90 transition-colors">
                          {s.description}
                        </span>
                        <Chord def={s} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-white/[0.06] flex items-center justify-between">
              <p className="text-[10px] text-white/15">
                <Key>?</Key> toggle this panel
              </p>
              <p className="text-[10px] text-white/15">
                <Key>{'\u2318'}K</Key> command palette
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
