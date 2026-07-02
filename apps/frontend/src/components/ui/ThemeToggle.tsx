'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import { Tooltip } from './Tooltip';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const label = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <Tooltip content={label} side="bottom">
      <button
        type="button"
        onClick={toggleTheme}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg text-white/55 hover:text-white hover:bg-white/[0.06] transition-all duration-200"
        aria-label={label}
      >
        <Sun
          className={`w-4 h-4 absolute transition-all duration-300 ${
            theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'
          }`}
        />
        <Moon
          className={`w-4 h-4 absolute transition-all duration-300 ${
            theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
          }`}
        />
      </button>
    </Tooltip>
  );
}
