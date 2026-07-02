export interface ShortcutDef {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  label: string;
  description: string;
  category: string;
  scope: 'global' | 'dashboard' | 'interview' | 'settings';
  isInputProtected?: boolean;
}

export const SHORTCUTS: ShortcutDef[] = [
  // ── Global ────────────────────────────────────────────
  {
    id: 'command-palette',
    key: 'k', meta: true,
    label: '\u2318K',
    description: 'Open command palette',
    category: 'Global',
    scope: 'global',
  },
  {
    id: 'shortcuts-modal',
    key: '?',
    label: '?',
    description: 'Toggle keyboard shortcuts',
    category: 'Global',
    scope: 'global',
    isInputProtected: true,
  },
  {
    id: 'close-modal',
    key: 'Escape',
    label: 'Esc',
    description: 'Close modal / panel',
    category: 'Global',
    scope: 'global',
  },

  // ── Dashboard ─────────────────────────────────────────
  {
    id: 'dashboard-new-interview',
    key: 'n',
    label: 'N',
    description: 'Focus schedule new interview form',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-search',
    key: '/',
    label: '/',
    description: 'Focus search bar',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-refresh',
    key: 'r',
    label: 'R',
    description: 'Refresh interview list',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-toggle-view',
    key: 'v',
    label: 'V',
    description: 'Toggle list / calendar view',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-filter-all',
    key: '1',
    label: '1',
    description: 'Filter: All interviews',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-filter-active',
    key: '2',
    label: '2',
    description: 'Filter: Active interviews',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-filter-scheduled',
    key: '3',
    label: '3',
    description: 'Filter: Scheduled interviews',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },
  {
    id: 'dashboard-filter-completed',
    key: '4',
    label: '4',
    description: 'Filter: Completed interviews',
    category: 'Dashboard',
    scope: 'dashboard',
    isInputProtected: true,
  },

  // ── Interview Room ────────────────────────────────────
  {
    id: 'room-toggle-mic',
    key: 'm',
    label: 'M',
    description: 'Toggle microphone',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-toggle-camera',
    key: 'v',
    label: 'V',
    description: 'Toggle camera',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-toggle-screenshare',
    key: 's',
    label: 'S',
    description: 'Toggle screen share',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-run-code',
    key: 'Enter', meta: true,
    label: '\u2318\u21B5',
    description: 'Run code sandbox',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-toggle-console',
    key: 'c', shift: true, ctrl: true,
    label: '\u21E7\u2303C',
    description: 'Toggle console panel',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-switch-editor',
    key: 'e', shift: true, ctrl: true,
    label: '\u21E7\u2303E',
    description: 'Switch to code editor',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-switch-whiteboard',
    key: 'w', shift: true, ctrl: true,
    label: '\u21E7\u2303W',
    description: 'Switch to whiteboard',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-open-transcript',
    key: 'r', shift: true, ctrl: true,
    label: '\u21E7\u2303R',
    description: 'Open transcript tab',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-format-code',
    key: 'f', shift: true, alt: true,
    label: '\u21E7\u2325F',
    description: 'Format code with Prettier',
    category: 'Interview Room',
    scope: 'interview',
  },
  {
    id: 'room-undo',
    key: 'z', meta: true,
    label: '\u2318Z',
    description: 'Undo whiteboard stroke',
    category: 'Interview Room',
    scope: 'interview',
  },
  {
    id: 'room-redo',
    key: 'y', meta: true,
    label: '\u2318Y',
    description: 'Redo whiteboard stroke',
    category: 'Interview Room',
    scope: 'interview',
  },
  {
    id: 'room-toggle-right-panel',
    key: 'b', meta: true,
    label: '\u2318B',
    description: 'Toggle right sidebar panel',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-tab-1',
    key: '1', alt: true,
    label: '\u23251',
    description: 'Open Editor tab',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-tab-2',
    key: '2', alt: true,
    label: '\u23252',
    description: 'Open Whiteboard tab',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },
  {
    id: 'room-tab-3',
    key: '3', alt: true,
    label: '\u23253',
    description: 'Open Console tab',
    category: 'Interview Room',
    scope: 'interview',
    isInputProtected: true,
  },

  // ── Settings ──────────────────────────────────────────
  {
    id: 'settings-save',
    key: 's', meta: true,
    label: '\u2318S',
    description: 'Save settings',
    category: 'Settings',
    scope: 'settings',
  },
];

export function getShortcutsForScope(scope: ShortcutDef['scope']): ShortcutDef[] {
  return SHORTCUTS.filter((s) => s.scope === 'global' || s.scope === scope);
}

const SYMBOLS: Record<string, string> = {
  meta: '\u2318',
  shift: '\u21E7',
  ctrl: '\u2303',
  alt: '\u2325',
};

export function formatShortcut(def: ShortcutDef): string {
  const parts: string[] = [];
  if (def.meta) parts.push(SYMBOLS.meta);
  if (def.ctrl) parts.push(SYMBOLS.ctrl);
  if (def.shift) parts.push(SYMBOLS.shift);
  if (def.alt) parts.push(SYMBOLS.alt);
  parts.push(def.key.length === 1 ? def.key.toUpperCase() : def.key);
  return parts.join('');
}

export function shortcutMatchesEvent(def: ShortcutDef, e: KeyboardEvent): boolean {
  if (!e.key || !def.key) return false;
  const key = def.key.toLowerCase();
  const eventKey = e.key.toLowerCase();
  const isModifierMatch =
    (def.meta ? e.metaKey : true) &&
    (def.ctrl ? e.ctrlKey : true) &&
    (def.shift ? e.shiftKey : true) &&
    (def.alt ? e.altKey : true);

  // If the shortcut has modifiers, match accordingly
  if (def.meta || def.ctrl || def.shift || def.alt) {
    return isModifierMatch && eventKey === key;
  }

  // Single-key shortcuts: match the key only, ensure NO modifiers pressed
  return eventKey === key && !e.metaKey && !e.ctrlKey && !e.altKey;
}
