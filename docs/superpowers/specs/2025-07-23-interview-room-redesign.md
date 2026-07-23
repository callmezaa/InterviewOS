# Interview Room Redesign — Design Spec

> **Date:** 2025-07-23
> **Approach:** Clean Refactor (Approach A)
> **Scope:** Interview room layout, header, toolbar, video PIP, console, right panel

---

## Goal

Redesign the interview room to be a standalone page (no dashboard navbar), with a clean, spacious layout optimized for the core workflow: code editing, communication, and collaboration.

## Current Problems

1. **Dashboard navbar in interview room** — global nav bar (logo, nav links, mode switcher) takes space and breaks context
2. **Gray header background** — `bg-surface-tile-3/80` looks inconsistent with the black editor area
3. **3-panel layout is cramped** — video sidebar + editor + right panel leaves little space for the editor
4. **Inconsistent styling** — mixed backgrounds, borders, spacing across components
5. **Too many UI elements in header** — timer, connection, recording, evaluate, exit all crammed into sub-nav

## Design Decisions

### 1. Header: Minimal Custom Header

**Decision:** Remove global nav bar. Create minimal custom header.

**Spec:**
- Height: `h-11` (44px)
- Background: `bg-surface-black` (pure black)
- Border: `border-b border-white/[0.06]`
- Left side: `←` back button (navigates to `/dashboard`) + interview title (truncated, `font-semibold text-[14px]`)
- Right side: Timer pill (`font-mono text-[12px]`), ConnectionHealth indicator, Exit button (`text-red-400`)
- No logo, no nav links, no mode switcher

**Files:**
- Create: `src/components/interview/InterviewRoomHeader.tsx`
- Modify: `src/app/interview/[id]/InterviewRoom.tsx`

### 2. Layout: 2-Panel Structure

**Decision:** Remove video sidebar. Editor takes full width. Right panel stays.

**Spec:**
- Main area: `flex-1 flex flex-row overflow-hidden`
- Left panel (flex-1): Toolbar + Editor + Console
- Right panel (340px expanded, 44px collapsed): Collapsible sidebar
- No video sidebar in main layout (moved to PIP)

**Files:**
- Modify: `src/app/interview/[id]/InterviewRoom.tsx`

### 3. Interview Toolbar

**Decision:** Create compact toolbar above editor. Consolidate all controls.

**Spec:**
- Height: `h-10` (40px)
- Background: `bg-surface-black`
- Border: `border-b border-white/[0.06]`
- Left section:
  - Tab buttons: Code Editor | Tests | Whiteboard (`h-7`, `text-[12px]`)
  - Separator (`w-px h-4 bg-white/[0.06]`)
  - Language selector dropdown (`h-7`)
  - Run button (`h-7`, `bg-primary text-white`)
  - AI Generator button (`h-7`)
  - Format button (`h-7`)
- Right section:
  - Connection status indicator
  - Recording indicator (if recording, `text-red-400`)
  - Focus mode toggle (`h-7`)
  - Right panel toggle (`h-7`)
  - Keyboard shortcuts button (`h-7`)
  - Evaluate button (interviewer only, `h-7`)
  - Exit button (`h-7`, `text-red-400`)

**Button styles:**
- Default: `text-body-muted/60 hover:text-white hover:bg-white/[0.04]`
- Active: `bg-white/[0.08] text-white`
- Icon-only with tooltips

**Files:**
- Create: `src/components/interview/InterviewToolbar.tsx`
- Modify: `src/components/ui/WorkspaceEditor.tsx` (remove toolbar, keep editor only)

### 4. Video PIP (Floating Overlay)

**Decision:** Video feeds become floating PIP overlay in bottom-right corner.

**Spec:**
- Position: `fixed bottom-4 right-4 z-50`
- Default size: `200x150px`
- Draggable (mousedown/mousemove on header)
- Minimize button: collapses to small icon circle
- Expand button: opens full video grid modal
- Auto-hide when no active peers
- Background: `bg-surface-black border border-white/[0.06] rounded-lg`
- Shadow: `shadow-lg shadow-black/50`

**Files:**
- Create: `src/components/interview/VideoPIP.tsx`
- Modify: `src/components/interview/VideoGrid.tsx` (adapt for PIP mode)

### 5. Console Panel

**Decision:** Keep collapsible bottom panel. Make more compact.

**Spec:**
- Header height: `h-8` (32px)
- Header background: `bg-surface-black`
- Body height: `180px` (when open)
- Body background: `bg-surface-black`
- Border: `border-t border-white/[0.06]`
- Tabs: Terminal | Telemetry (`text-[11px]`)
- Clear button: icon only (trash icon)
- Toggle button: arrow icon (▲/▼)
- Output font: `font-mono text-[11px]`
- stdout: `text-emerald-400`
- stderr: `text-red-400`

**Files:**
- Modify: `src/app/interview/[id]/components/ConsolePanel.tsx`

### 6. Right Panel

**Decision:** Keep collapsible sidebar. Make narrower and more compact.

**Spec:**
- Width: `340px` (expanded), `44px` (collapsed)
- Header height: `h-10` (40px)
- Background: `bg-surface-black`
- Border: `border-l border-white/[0.06]`
- Tabs: Transcript | Chat | Notes | Copilot | Proctoring (`text-[11px]`)
- Tab icons: small, minimal
- Content: same functionality, cleaner styling

**Files:**
- Modify: `src/app/interview/[id]/components/RightPanel.tsx`

### 7. Color Scheme (Consistent)

| Token | Value | Usage |
|-------|-------|-------|
| `bg-surface-black` | `#000000` | All backgrounds |
| `border-white/[0.06]` | white at 6% | All borders |
| `bg-white/[0.04]` | white at 4% | Hover states |
| `bg-white/[0.08]` | white at 8% | Active states |
| `text-body-muted/50` | white at 50% | Secondary text |
| `text-body-muted/70` | white at 70% | Primary text |
| `text-white` | `#ffffff` | Headings |
| `bg-primary` | `#0066cc` | Primary actions |
| `text-primary-on-dark` | `#2997ff` | Accent text |

### 8. Spacing (Consistent)

| Element | Value |
|---------|-------|
| Header height | `h-11` (44px) |
| Toolbar height | `h-10` (40px) |
| Right panel header | `h-10` (40px) |
| Console header | `h-8` (32px) |
| Console body | `180px` |
| Right panel width | `340px` |
| Right panel collapsed | `44px` |
| Main padding | `p-3` (12px) |
| Gaps | `gap-3` (12px) |
| Border radius | `rounded-lg` (8px) |
| Button height | `h-8` (32px) |
| Toolbar button height | `h-7` (28px) |
| Font sizes | `[11px]` (labels), `[12px]` (body), `[13px]` (headings), `[14px]` (title) |

---

## Component Tree (New)

```
<main> — h-screen, bg-surface-black, flex flex-col
├── InterviewRoomHeader (h-11)
│   ├── Back button + Interview title
│   └── Timer + ConnectionHealth + Exit button
│
├── InterviewToolbar (h-10)
│   ├── Left: Tab buttons | Language | Run | AI | Format
│   └── Right: Recording | Focus | Panel | ? | Evaluate | Exit
│
├── Content Area — flex-1, flex flex-row, overflow-hidden
│   ├── Editor Area — flex-1, flex flex-col
│   │   ├── WorkspaceEditor (flex-1, no toolbar)
│   │   └── ConsolePanel (180px, collapsible)
│   │
│   └── RightPanel (340px, collapsible)
│       ├── Header (h-10) — tab buttons
│       └── Body — scrollable content
│
├── VideoPIP (fixed, bottom-right, draggable)
│   └── VideoGrid (compact)
│
├── AIQuestionGeneratorModal
├── ConfirmDialog (exit)
├── ConfirmDialog (evaluate)
├── KeyboardShortcutsSheet
└── ProctoringWarningModal
```

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/components/interview/InterviewRoomHeader.tsx` | **Create** | Minimal header (back + title + timer + exit) |
| `src/components/interview/InterviewToolbar.tsx` | **Create** | Compact toolbar (tabs + controls + actions) |
| `src/components/interview/VideoPIP.tsx` | **Create** | Floating draggable video overlay |
| `src/app/interview/[id]/InterviewRoom.tsx` | **Major** | New layout structure, remove old header |
| `src/components/ui/WorkspaceEditor.tsx` | **Simplify** | Remove toolbar (moved to InterviewToolbar) |
| `src/app/interview/[id]/components/ConsolePanel.tsx` | **Restyle** | Smaller header, smaller body, black bg |
| `src/app/interview/[id]/components/RightPanel.tsx` | **Restyle** | Narrower width, smaller header, black bg |
| `src/components/interview/VideoGrid.tsx` | **Adapt** | Support PIP mode (compact layout) |

**Total: 3 new files, 5 modified files**

---

## Success Criteria

1. Interview room loads without dashboard navbar
2. Header is minimal (back + title + timer + exit)
3. Editor takes full width (minus right panel)
4. Video feeds appear as floating PIP overlay
5. All backgrounds are pure black
6. All borders are consistent (`border-white/[0.06]`)
7. All spacing is consistent (`h-10`, `h-8`, `p-3`, `gap-3`)
8. Right panel is collapsible (340px ↔ 44px)
9. Console panel is collapsible (180px)
10. All existing functionality preserved (code editing, chat, transcript, notes, copilot, proctoring)

---

## Non-Goals

- Backend/WebSocket changes (socket still connects to backend if available)
- New features (only layout/styling changes)
- Mobile optimization (current responsive behavior preserved)
- Accessibility improvements (current a11y preserved)

---

## Risks

1. **WorkspaceEditor toolbar extraction** — moving toolbar to InterviewToolbar requires careful state management (language selector, run button, AI button)
2. **Video PIP drag implementation** — needs smooth drag behavior without performance issues
3. **Right panel collapse animation** — needs smooth width transition
4. **Console panel state** — needs to persist open/close state across tab switches

---

## Open Questions

None — all design decisions approved by user.
