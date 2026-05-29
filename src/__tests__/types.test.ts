import { describe, it, expect } from 'vitest';
import {
  clampSettings,
  DEFAULT_SETTINGS,
  TIMER_MIN,
  TIMER_MAX,
  TYPING_MIN,
  TYPING_MAX,
} from '../types.ts';

describe('clampSettings', () => {
  it('leaves in-range values untouched', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      timerDuration: 45,
      typingLength: 20,
    };
    expect(clampSettings(settings)).toEqual(settings);
  });

  it('clamps timer duration below the minimum', () => {
    const result = clampSettings({ ...DEFAULT_SETTINGS, timerDuration: 1 });
    expect(result.timerDuration).toBe(TIMER_MIN);
  });

  it('clamps timer duration above the maximum', () => {
    const result = clampSettings({ ...DEFAULT_SETTINGS, timerDuration: 9999 });
    expect(result.timerDuration).toBe(TIMER_MAX);
  });

  it('clamps word count below the minimum', () => {
    const result = clampSettings({ ...DEFAULT_SETTINGS, typingLength: 0 });
    expect(result.typingLength).toBe(TYPING_MIN);
  });

  it('clamps word count above the maximum', () => {
    const result = clampSettings({ ...DEFAULT_SETTINGS, typingLength: 500 });
    expect(result.typingLength).toBe(TYPING_MAX);
  });

  it('rounds fractional values', () => {
    const result = clampSettings({ ...DEFAULT_SETTINGS, timerDuration: 30.7 });
    expect(result.timerDuration).toBe(31);
  });

  it('falls back to the minimum for non-finite values', () => {
    const result = clampSettings({ ...DEFAULT_SETTINGS, timerDuration: NaN });
    expect(result.timerDuration).toBe(TIMER_MIN);
  });

  it('preserves unlockMethod and theme', () => {
    const result = clampSettings({
      ...DEFAULT_SETTINGS,
      unlockMethod: 'typing',
      theme: 'dark',
    });
    expect(result.unlockMethod).toBe('typing');
    expect(result.theme).toBe('dark');
  });
});
