'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, RotateCcw, Monitor, Sun, Moon, Type, CornerDownRight } from 'lucide-react';
import { Card } from '../ui/Card';
import type { ThemeConfig, ThemePreset } from '@interviewos/shared';
import { DEFAULT_THEME, THEME_PRESETS } from '@interviewos/shared';

interface ThemeBuilderProps {
  value: ThemeConfig | null;
  onChange: (theme: ThemeConfig) => void;
  disabled?: boolean;
}

function ColorInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[12px] text-body-muted/70">{label}</span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-7 h-7 rounded-md border border-white/[0.1] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ padding: 0 }}
          />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onChange(v);
          }}
          onBlur={(e) => {
            if (!/^#[0-9a-fA-F]{6}$/.test(e.target.value)) {
              onChange(value);
            }
          }}
          disabled={disabled}
          className="w-[72px] h-7 px-2 text-[11px] font-mono bg-white/[0.04] border border-white/[0.08] rounded text-white/80 focus:outline-none focus:border-primary/40 disabled:opacity-40"
        />
      </div>
    </div>
  );
}

function PresetCard({
  preset,
  isActive,
  onClick,
  disabled,
}: {
  preset: ThemePreset;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const c = preset.theme.colors;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex flex-col gap-2 p-3 rounded-lg border transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed ${
        isActive
          ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/30'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-white">{preset.name}</span>
        {isActive && <Check className="w-3.5 h-3.5 text-primary" />}
      </div>
      <p className="text-[11px] text-body-muted/50 leading-snug">{preset.description}</p>
      <div className="flex gap-1 mt-0.5">
        <div className="w-5 h-5 rounded-full border border-white/[0.1]" style={{ backgroundColor: c.primary }} />
        <div className="w-5 h-5 rounded-full border border-white/[0.1]" style={{ backgroundColor: c.success }} />
        <div className="w-5 h-5 rounded-full border border-white/[0.1]" style={{ backgroundColor: c.warning }} />
        <div className="w-5 h-5 rounded-full border border-white/[0.1]" style={{ backgroundColor: c.danger }} />
        <div className="w-5 h-5 rounded-full border border-white/[0.1]" style={{ backgroundColor: c.bgDark }} />
      </div>
    </button>
  );
}

function ThemePreview({ theme }: { theme: ThemeConfig }) {
  const c = theme.colors;
  return (
    <div className="rounded-lg border border-white/[0.08] overflow-hidden">
      <div className="p-3 flex items-center gap-2" style={{ backgroundColor: c.bgDark }}>
        <div className="w-4 h-4 rounded" style={{ backgroundColor: c.primary }} />
        <div className="h-2.5 w-16 rounded-full" style={{ backgroundColor: c.textDark, opacity: 0.6 }} />
        <div className="ml-auto flex gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.success }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.warning }} />
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.danger }} />
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2" style={{ backgroundColor: c.bgDark }}>
        <div className="flex gap-2">
          <div className="flex-1 h-6 rounded" style={{ backgroundColor: c.primary }} />
          <div className="flex-1 h-6 rounded border" style={{ borderColor: c.primary, backgroundColor: 'transparent' }} />
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: c.textDark, opacity: 0.3 }} />
          <div className="h-2 w-8 rounded-full" style={{ backgroundColor: c.textDark, opacity: 0.3 }} />
        </div>
        <div className="flex gap-1.5">
          <div className="h-2 flex-1 rounded-full" style={{ backgroundColor: c.textDark, opacity: 0.2 }} />
          <div className="h-2 w-12 rounded-full" style={{ backgroundColor: c.textDark, opacity: 0.2 }} />
        </div>
      </div>
      <div className="flex">
        <div className="flex-1 p-2 flex flex-col gap-1" style={{ backgroundColor: c.bgLight }}>
          <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: c.textLight, opacity: 0.4 }} />
          <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: c.textLight, opacity: 0.2 }} />
        </div>
        <div className="flex-1 p-2 flex flex-col gap-1" style={{ backgroundColor: darkenHex(c.bgLight, 0.04) }}>
          <div className="h-1.5 w-8 rounded-full" style={{ backgroundColor: c.textLight, opacity: 0.4 }} />
          <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: c.textLight, opacity: 0.2 }} />
        </div>
      </div>
    </div>
  );
}

function darkenHex(hex: string, amount: number): string {
  const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!m) return hex;
  const r = Math.max(0, parseInt(m[1], 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(m[2], 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(m[3], 16) - Math.round(255 * amount));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function ThemeBuilder({ value, onChange, disabled }: ThemeBuilderProps) {
  const [showCustom, setShowCustom] = useState(false);
  const current = value ?? DEFAULT_THEME;

  const activePresetId = useMemo(() => {
    if (!value?.presetId) return null;
    return THEME_PRESETS.find((p) => p.id === value.presetId)?.id ?? null;
  }, [value?.presetId]);

  const handlePresetClick = useCallback(
    (preset: ThemePreset) => {
      onChange(preset.theme);
      setShowCustom(false);
    },
    [onChange],
  );

  const handleColorChange = useCallback(
    (key: keyof ThemeConfig['colors'], val: string) => {
      onChange({
        ...current,
        presetId: undefined,
        colors: { ...current.colors, [key]: val },
      });
    },
    [current, onChange],
  );

  const handleReset = useCallback(() => {
    onChange(DEFAULT_THEME);
    setShowCustom(false);
  }, [onChange]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-primary" />
          <h4 className="text-[14px] font-semibold text-white">Color Theme</h4>
        </div>
        <button
          onClick={handleReset}
          disabled={disabled}
          className="flex items-center gap-1.5 text-[11px] text-body-muted/50 hover:text-body-muted/80 transition-colors disabled:opacity-40"
        >
          <RotateCcw className="w-3 h-3" />
          Reset
        </button>
      </div>

      {/* Presets */}
      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onClick={() => handlePresetClick(preset)}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Custom toggle */}
      <button
        onClick={() => setShowCustom(!showCustom)}
        disabled={disabled}
        className="flex items-center gap-2 text-[12px] text-body-muted/60 hover:text-body-muted/90 transition-colors disabled:opacity-40"
      >
        <CornerDownRight className="w-3.5 h-3.5" />
        {showCustom ? 'Hide custom colors' : 'Customize individual colors'}
      </button>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card variant="default" className="p-4 flex flex-col gap-3">
              <p className="text-[11px] font-semibold text-body-muted/50 uppercase tracking-wider">
                Accent Colors
              </p>
              <ColorInput
                label="Primary"
                value={current.colors.primary}
                onChange={(v) => handleColorChange('primary', v)}
                disabled={disabled}
              />
              <ColorInput
                label="Primary Hover"
                value={current.colors.primaryHover}
                onChange={(v) => handleColorChange('primaryHover', v)}
                disabled={disabled}
              />
              <ColorInput
                label="Success"
                value={current.colors.success}
                onChange={(v) => handleColorChange('success', v)}
                disabled={disabled}
              />
              <ColorInput
                label="Warning"
                value={current.colors.warning}
                onChange={(v) => handleColorChange('warning', v)}
                disabled={disabled}
              />
              <ColorInput
                label="Danger"
                value={current.colors.danger}
                onChange={(v) => handleColorChange('danger', v)}
                disabled={disabled}
              />

              <div className="border-t border-white/[0.06] pt-3 mt-1">
                <p className="text-[11px] font-semibold text-body-muted/50 uppercase tracking-wider mb-3">
                  Dark Mode Surfaces
                </p>
                <div className="flex flex-col gap-3">
                  <ColorInput
                    label="Background"
                    value={current.colors.bgDark}
                    onChange={(v) => handleColorChange('bgDark', v)}
                    disabled={disabled}
                  />
                  <ColorInput
                    label="Muted Text"
                    value={current.colors.textDark}
                    onChange={(v) => handleColorChange('textDark', v)}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-3 mt-1">
                <p className="text-[11px] font-semibold text-body-muted/50 uppercase tracking-wider mb-3">
                  Light Mode Surfaces
                </p>
                <div className="flex flex-col gap-3">
                  <ColorInput
                    label="Background"
                    value={current.colors.bgLight}
                    onChange={(v) => handleColorChange('bgLight', v)}
                    disabled={disabled}
                  />
                  <ColorInput
                    label="Muted Text"
                    value={current.colors.textLight}
                    onChange={(v) => handleColorChange('textLight', v)}
                    disabled={disabled}
                  />
                </div>
              </div>

              <div className="border-t border-white/[0.06] pt-3 mt-1">
                <p className="text-[11px] font-semibold text-body-muted/50 uppercase tracking-wider mb-3">
                  Typography & Shape
                </p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-body-muted/70">
                      <Type className="w-3 h-3" />
                      Display Font
                    </div>
                    <input
                      type="text"
                      value={current.fontDisplay ?? ''}
                      onChange={(e) =>
                        onChange({ ...current, presetId: undefined, fontDisplay: e.target.value || undefined })
                      }
                      placeholder="SF Pro Display"
                      disabled={disabled}
                      className="w-40 h-7 px-2 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded text-white/80 placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 disabled:opacity-40"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-body-muted/70">
                      <Type className="w-3 h-3" />
                      Body Font
                    </div>
                    <input
                      type="text"
                      value={current.fontBody ?? ''}
                      onChange={(e) =>
                        onChange({ ...current, presetId: undefined, fontBody: e.target.value || undefined })
                      }
                      placeholder="SF Pro Text"
                      disabled={disabled}
                      className="w-40 h-7 px-2 text-[11px] bg-white/[0.04] border border-white/[0.08] rounded text-white/80 placeholder:text-body-muted/30 focus:outline-none focus:border-primary/40 disabled:opacity-40"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 text-[12px] text-body-muted/70">
                      <CornerDownRight className="w-3 h-3" />
                      Corner Radius
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={current.radiusScale ?? 1}
                        onChange={(e) =>
                          onChange({ ...current, presetId: undefined, radiusScale: parseFloat(e.target.value) })
                        }
                        disabled={disabled}
                        className="w-24 h-1 accent-primary"
                      />
                      <span className="text-[11px] text-body-muted/50 w-6 text-right font-mono">
                        {(current.radiusScale ?? 1).toFixed(1)}x
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Live Preview */}
      <div>
        <p className="text-[11px] font-semibold text-body-muted/50 uppercase tracking-wider mb-2">
          Preview
        </p>
        <ThemePreview theme={current} />
      </div>
    </div>
  );
}
