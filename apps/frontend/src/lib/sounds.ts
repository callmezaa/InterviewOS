'use client';

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  return ctx;
}

function resumeCtx() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

interface ToneOptions {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  volume: number;
  attack?: number;
  release?: number;
}

function playTone(opts: ToneOptions) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();

  osc.type = opts.type ?? 'sine';
  osc.frequency.value = opts.frequency;

  const attack = opts.attack ?? 0.01;
  const release = opts.release ?? 0.1;
  const now = c.currentTime;

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(opts.volume, now + attack);
  gain.gain.linearRampToValueAtTime(0, now + opts.duration);

  osc.connect(gain);
  gain.connect(c.destination);

  osc.start(now);
  osc.stop(now + opts.duration + release);
}

// ── Notification Tones ───────────────────────────────────────

export function playSuccess(volume = 0.3) {
  resumeCtx();
  playTone({ frequency: 880, duration: 0.12, type: 'sine', volume });
  setTimeout(() => playTone({ frequency: 1100, duration: 0.15, type: 'sine', volume }), 100);
}

export function playError(volume = 0.3) {
  resumeCtx();
  playTone({ frequency: 300, duration: 0.2, type: 'square', volume: volume * 0.6 });
  setTimeout(() => playTone({ frequency: 250, duration: 0.25, type: 'square', volume: volume * 0.5 }), 150);
}

export function playInfo(volume = 0.25) {
  resumeCtx();
  playTone({ frequency: 660, duration: 0.1, type: 'sine', volume });
}

export function playWarning(volume = 0.3) {
  resumeCtx();
  playTone({ frequency: 500, duration: 0.15, type: 'triangle', volume });
  setTimeout(() => playTone({ frequency: 600, duration: 0.15, type: 'triangle', volume }), 120);
}

export function playNotification(volume = 0.25) {
  resumeCtx();
  playTone({ frequency: 587, duration: 0.1, type: 'sine', volume });
  setTimeout(() => playTone({ frequency: 784, duration: 0.12, type: 'sine', volume }), 80);
  setTimeout(() => playTone({ frequency: 1047, duration: 0.15, type: 'sine', volume }), 180);
}

export const SOUND_MAP = {
  success: playSuccess,
  error: playError,
  info: playInfo,
  warning: playWarning,
  notification: playNotification,
} as const;

export type SoundType = keyof typeof SOUND_MAP;

export function playSound(type: SoundType, volume = 0.3) {
  try {
    SOUND_MAP[type](volume);
  } catch {
    // Silently fail — audio context may not be available
  }
}
