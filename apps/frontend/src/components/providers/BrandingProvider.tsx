'use client';

import React, { createContext, useContext, useMemo, useEffect } from 'react';
import { useInterviewStore } from '../../store/useInterviewStore';
import type { BrandSettings, ThemeConfig } from '@interviewos/shared';
import { DEFAULT_BRAND, DEFAULT_THEME } from '@interviewos/shared';

const BrandingContext = createContext<BrandSettings>(DEFAULT_BRAND);

const STYLE_TAG_ID = 'theme-overrides';

function hexToHslComponents(hex: string): string | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255;
  const g = parseInt(m[2], 16) / 255;
  const b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function lighten(hex: string, amount: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = Math.min(255, parseInt(m[1], 16) + Math.round(255 * amount));
  const g = Math.min(255, parseInt(m[2], 16) + Math.round(255 * amount));
  const b = Math.min(255, parseInt(m[3], 16) + Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function darken(hex: string, amount: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(m[2], 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(m[3], 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function buildThemeCSS(theme: ThemeConfig | null | undefined): string {
  if (!theme?.colors) return '';

  const c = theme.colors;
  const primaryFocus = c.primaryHover || darken(c.primary, 0.08);
  const primaryOnDark = lighten(c.primary, 0.25);
  const successSoft = lighten(c.success, 0.15);
  const warningSoft = lighten(c.warning, 0.15);
  const dangerSoft = lighten(c.danger, 0.15);
  const primaryGlow = `${c.primary}4d`; // 30% opacity
  const primaryOnDarkGlow = `${primaryOnDark}4d`;
  const dangerGlow = `${c.danger}26`; // 15% opacity

  const radius = theme.radiusScale ?? 1;
  const radiusMd = `${Math.round(8 * radius)}px`;
  const radiusLg = `${Math.round(12 * radius)}px`;

  let css = `
    /* Theme overrides — injected by BrandingProvider */
    :root {
      --color-primary: ${c.primary};
      --color-primary-focus: ${primaryFocus};
      --color-primary-on-dark: ${primaryOnDark};
      --color-on-primary: #ffffff;
      --color-on-primary-solid: #ffffff;
      --color-success: ${c.success};
      --color-success-soft: ${successSoft};
      --color-warning: ${c.warning};
      --color-warning-soft: ${warningSoft};
      --color-danger: ${c.danger};
      --color-danger-soft: ${dangerSoft};
      --color-primary-glow: ${primaryGlow};
      --color-primary-on-dark-glow: ${primaryOnDarkGlow};
      --color-danger-glow: ${dangerGlow};
      --radius-md: ${radiusMd};
      --radius-lg: ${radiusLg};
    }

    /* Dark mode surfaces */
    :root,
    [data-theme="dark"] {
      --color-surface-tile-1: ${c.bgDark};
      --color-surface-tile-2: ${lighten(c.bgDark, 0.04)};
      --color-surface-tile-3: ${darken(c.bgDark, 0.02)};
      --color-body-muted: ${c.textDark};
    }

    /* Light mode surfaces */
    [data-theme="light"] {
      --color-surface-tile-1: ${c.bgLight};
      --color-surface-tile-2: ${darken(c.bgLight, 0.04)};
      --color-surface-tile-3: ${darken(c.bgLight, 0.08)};
      --color-body-muted: ${c.textLight};
    }
  `;

  if (theme.fontDisplay || theme.fontBody) {
    css += `:root {`;
    if (theme.fontDisplay) {
      css += `\n  --font-display: "${theme.fontDisplay}", "SF Pro Display", "Inter", system-ui, sans-serif;`;
    }
    if (theme.fontBody) {
      css += `\n  --font-sans: "${theme.fontBody}", "SF Pro Text", "Inter", system-ui, sans-serif;`;
    }
    css += `\n}\n`;
  }

  return css;
}

function injectThemeCSS(css: string) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById(STYLE_TAG_ID);
  if (!css) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_TAG_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const user = useInterviewStore((s: { user: any }) => s.user);

  const branding = useMemo<BrandSettings>(() => {
    return user?.branding ?? DEFAULT_BRAND;
  }, [user?.branding]);

  useEffect(() => {
    const css = buildThemeCSS(branding.theme ?? null);
    injectThemeCSS(css);
  }, [branding.theme]);

  return (
    <BrandingContext.Provider value={branding}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandSettings {
  return useContext(BrandingContext);
}
