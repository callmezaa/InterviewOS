'use client';

import React, { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom';
  delay?: number;
}

export function Tooltip({ content, shortcut, children, side = 'top', delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const show = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  const positionClasses = side === 'top'
    ? 'bottom-full left-1/2 -translate-x-1/2 mb-2'
    : 'top-full left-1/2 -translate-x-1/2 mt-2';

  return (
    <div className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {visible && (
        <div
          role="tooltip"
          className={`absolute ${positionClasses} z-[9999] px-2 py-1.5 text-[11px] font-medium text-white bg-surface-tile-3 border border-white/[0.08] rounded-md whitespace-nowrap pointer-events-none shadow-lg animate-in fade-in-0 zoom-in-95`}
        >
          <div className="flex items-center gap-2">
            <span>{content}</span>
            {shortcut && <Kbd>{shortcut}</Kbd>}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono font-semibold text-body-muted/70 bg-white/[0.06] border border-white/[0.1] rounded shadow-[0_1px_0_rgba(255,255,255,0.05)]">
      {children}
    </kbd>
  );
}
