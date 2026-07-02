'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { Card } from '../ui/Card';
import { useSoundStore } from '../../store/useSoundStore';
import { playSound } from '../../lib/sounds';

export default function SoundSettings() {
  const { enabled, volume, toggle, setVolume } = useSoundStore();

  const handleToggle = () => {
    toggle();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
  };

  const handleTest = () => {
    playSound('notification', volume);
  };

  return (
    <Card variant="default" className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          enabled ? 'bg-primary/10 border border-primary/20' : 'bg-white/[0.03] border border-white/[0.06]'
        }`}>
          {enabled ? (
            <Volume2 className="w-4 h-4 text-primary-on-dark" />
          ) : (
            <VolumeX className="w-4 h-4 text-body-muted/50" />
          )}
        </div>
        <div>
          <h4 className="font-semibold text-[14px] text-white">Notification Sounds</h4>
          <p className="text-[12px] text-body-muted/55 mt-0.5 max-w-[320px] leading-relaxed">
            Play a sound when toasts appear or new notifications arrive.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {enabled && (
          <button
            type="button"
            onClick={handleTest}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-body-muted/60 hover:text-white bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all"
          >
            Test
          </button>
        )}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle notification sounds"
          onClick={handleToggle}
          className={`relative w-9 h-5 rounded-full p-0.5 transition-colors duration-200 outline-none focus-visible:ring-1 focus-visible:ring-primary/50 ${
            enabled ? 'bg-primary' : 'bg-white/10'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
              enabled ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {enabled && (
        <div className="col-span-full flex items-center gap-3 mt-1">
          <VolumeX className="w-3.5 h-3.5 text-body-muted/40 shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer"
            aria-label="Notification volume"
          />
          <Volume2 className="w-3.5 h-3.5 text-body-muted/40 shrink-0" />
        </div>
      )}
    </Card>
  );
}
