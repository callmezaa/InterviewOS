import { create } from 'zustand';

interface SoundStore {
  enabled: boolean;
  volume: number;
  setEnabled: (enabled: boolean) => void;
  setVolume: (volume: number) => void;
  toggle: () => void;
}

function loadPrefs(): { enabled: boolean; volume: number } {
  if (typeof window === 'undefined') return { enabled: true, volume: 0.3 };
  try {
    const raw = localStorage.getItem('sound_prefs');
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: parsed.enabled ?? true,
        volume: typeof parsed.volume === 'number' ? parsed.volume : 0.3,
      };
    }
  } catch {}
  return { enabled: true, volume: 0.3 };
}

function savePrefs(enabled: boolean, volume: number) {
  try {
    localStorage.setItem('sound_prefs', JSON.stringify({ enabled, volume }));
  } catch {}
}

const initial = loadPrefs();

export const useSoundStore = create<SoundStore>((set) => ({
  enabled: initial.enabled,
  volume: initial.volume,
  setEnabled: (enabled) => {
    set((s) => {
      savePrefs(enabled, s.volume);
      return { enabled };
    });
  },
  setVolume: (volume) => {
    set((s) => {
      savePrefs(s.enabled, volume);
      return { volume };
    });
  },
  toggle: () =>
    set((s) => {
      const next = !s.enabled;
      savePrefs(next, s.volume);
      return { enabled: next };
    }),
}));
