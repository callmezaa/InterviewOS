'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

const COMMAND = 'npx interviewos init';

export function TerminalCopyBox() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = COMMAND;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }, [copied]);

  return (
    <button
      id="terminal-copy-box"
      onClick={handleCopy}
      aria-label="Copy install command to clipboard"
      className={`
        group relative flex items-center gap-3
        px-4 py-2.5 rounded-lg
        bg-white/[0.025] border border-white/[0.06]
        shadow-[inset_0_1.5px_0_rgba(255,255,255,0.04)]
        hover:bg-white/[0.04] hover:border-white/[0.12]
        hover:shadow-[inset_0_1.5px_0_rgba(255,255,255,0.07)]
        transition-all duration-300 ease-out
        cursor-pointer select-none
        ${copied ? 'border-primary/30 bg-primary/[0.04] shadow-[inset_0_1.5px_0_rgba(41,151,255,0.08),0_0_20px_-6px_rgba(41,151,255,0.15)]' : ''}
      `}
    >
      {/* Terminal prompt prefix */}
      <span className="font-mono text-[13px] text-white/25 select-none flex-shrink-0">
        $
      </span>

      {/* Command text */}
      <span className="font-mono text-[13px] text-white/60 group-hover:text-white/80 transition-colors duration-200 tracking-tight">
        {COMMAND}
      </span>

      {/* Divider */}
      <span className="w-px h-4 bg-white/[0.08] flex-shrink-0" />

      {/* Copy / Check icon with AnimatePresence swap */}
      <span className="relative w-4 h-4 flex-shrink-0">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.5, rotate: -15 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Check className="w-3.5 h-3.5 text-primary-on-dark" strokeWidth={2.5} />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Copy className="w-3.5 h-3.5 text-white/50 group-hover:text-white/55 transition-colors duration-200" strokeWidth={1.8} />
            </motion.span>
          )}
        </AnimatePresence>
      </span>

      {/* Subtle right-side "Copied!" tooltip */}
      <AnimatePresence>
        {copied && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono font-semibold text-primary-on-dark bg-surface-tile-2 border border-primary/20 px-2 py-0.5 rounded-md whitespace-nowrap pointer-events-none shadow-[0_4px_12px_rgba(0,0,0,0.3)]"
          >
            Copied!
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
