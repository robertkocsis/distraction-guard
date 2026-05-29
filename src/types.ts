export type UnlockMethod = 'timer' | 'typing';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  unlockMethod: UnlockMethod;
  timerDuration: number; // seconds
  typingLength: number; // word count
  theme: Theme;
}

export const DEFAULT_SETTINGS: Settings = {
  unlockMethod: 'timer',
  timerDuration: 30,
  typingLength: 15,
  theme: 'system',
};

export const TIMER_MIN = 10;
export const TIMER_MAX = 300;
export const TYPING_MIN = 10;
export const TYPING_MAX = 50;

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

// Bring possibly out-of-range values (e.g. synced from another device or an
// older version) back into the supported bounds.
export function clampSettings(settings: Settings): Settings {
  return {
    ...settings,
    timerDuration: clamp(settings.timerDuration, TIMER_MIN, TIMER_MAX),
    typingLength: clamp(settings.typingLength, TYPING_MIN, TYPING_MAX),
  };
}
