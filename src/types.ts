export type UnlockMethod = 'timer' | 'typing';
export type Theme = 'system' | 'light' | 'dark';

export interface Settings {
  unlockMethod: UnlockMethod;
  timerDuration: number; // seconds
  typingLength: number;  // word count
  theme: Theme;
}

export const DEFAULT_SETTINGS: Settings = {
  unlockMethod: 'timer',
  timerDuration: 30,
  typingLength: 15,
  theme: 'system',
};
