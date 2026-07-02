'use client';

import { useEffect, useRef } from 'react';
import { type ShortcutDef, shortcutMatchesEvent } from '../lib/shortcuts';

type ShortcutHandler = (e: KeyboardEvent) => void;

interface ShortcutBinding {
  def: ShortcutDef;
  handler: ShortcutHandler;
}

type HandlerMap = Map<string, ShortcutHandler>;

export function useShortcuts(bindings: ShortcutBinding[], enabled = true) {
  const bindingsRef = useRef(bindings);
  bindingsRef.current = bindings;

  useEffect(() => {
    if (!enabled) return;

    const handlerMap: HandlerMap = new Map();
    for (const b of bindings) {
      handlerMap.set(b.def.id, b.handler);
    }

    const listener = (e: KeyboardEvent) => {
      const el = document.activeElement;
      const isTyping =
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.getAttribute('contenteditable') === 'true');

      for (const b of bindingsRef.current) {
        if (!b?.def?.key) continue;
        if (!shortcutMatchesEvent(b.def, e)) continue;
        if (b.def.isInputProtected && isTyping) continue;

        e.preventDefault();
        e.stopPropagation();
        b.handler(e);
        return;
      }
    };

    document.addEventListener('keydown', listener, true);
    return () => document.removeEventListener('keydown', listener, true);
  }, [enabled]);
}
