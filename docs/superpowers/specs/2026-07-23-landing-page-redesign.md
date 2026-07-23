# Landing Page Redesign

**Date:** 2026-07-23 | **Status:** Implementation | **Priority:** High

---

## 1. Goals & Scope

- **Upgrade** design system to **shadcn/ui New York** + **beUI motion components**
- **Font swap:** Inter → **Geist** (Sans + Mono)
- **Logo:** New brand assets replace `Terminal` lucide icon
- **Evolve** current Apple-inspired dark aesthetic — not a rebuild
- **Scope:** Landing page only (all sections in `LandingPageContent.tsx` + related UI components)
- Non-landing pages (interview, settings, auth) stay untouched

---

## 2. Design System

### shadcn Configuration

| Property | Value |
|----------|-------|
| Style | `new-york` |
| Base color | `zinc` (neutral-cool, Apple-aligned) |
| CSS variables | Yes (enables dark/light theming) |
| Tailwind | `tailwindcss` v4 (CSS-first, no JS config) |

### Theme Architecture

Current `globals.css` uses hardcoded values in `@theme {}`. Refactored approach:

1. shadcn generates CSS variables in `:root` and `[data-theme="dark"]` / `[data-theme="light"]`
2. Our `@theme` block maps those CSS vars to Tailwind utilities
3. Apple custom tokens (`--color-surface-black`, etc.) also become CSS vars mapped through `@theme`

### Font System

| Role | Current | New |
|------|---------|-----|
| Sans | `Inter` | `Geist` via `geist` npm package |
| Mono | (system) | `Geist Mono` via `geist` npm package |
| Display | `Inter` | `Geist` (same as sans) |

### Logo

| Location | Current | New |
|----------|---------|-----|
| Nav brand | `Terminal` icon + "InterviewOS" | `<Image>` logo + "InterviewOS" |
| Favicon | old icons | Already in `public/favicon/` |

---

## 3. Components

### shadcn Components

```
button badge card tabs accordion navigation-menu
input separator sheet dropdown-menu
```

### beUI Components

```
@beui/shader-background  — animated hero backdrop
@beui/text-animation     — headline reveal
@beui/marquee            — social proof / testimonial logos
@beui/tabs               — How It Works interactive tabs
@beui/bouncy-accordion   — FAQ section
@beui/animated-badge     — feature section badges
```

### Replacements

| Old Custom File | Replace With |
|----------------|--------------|
| `Button.tsx` | shadcn `button` |
| `Badge.tsx` | shadcn `badge` |
| `FAQSection.tsx` | beUI `bouncy-accordion` |
| `FeatureCard.tsx` | shadcn `card` restyle |
| `HowItWorksSection.tsx` | beUI `tabs` restyle |

### Keep

- `InteractiveShowcase.tsx` — complex 3D/WebRTC demo, bespoke
- `TerminalCopyBox.tsx` — minor utility
- `ScrollReveal.tsx` — still useful with `motion`
- `PreFooterCTA.tsx` — already rewritten
- `SiteFooter.tsx` — refactor styling only
- `PricingCalloutSection.tsx` — already rewritten (now "Get Started")

---

## 4. Implementation Order

| Phase | What |
|-------|------|
| P0 | shadcn init + CSS merge |
| P1 | Install shadcn components |
| P2 | Install beUI components |
| P3 | Install geist + motion |
| P4 | Theme refactor + font swap |
| P5 | Logo integration |
| P6 | Landing page sections rewrite |
| P7 | framer-motion → motion migration |
| P8 | Cleanup + verification |
