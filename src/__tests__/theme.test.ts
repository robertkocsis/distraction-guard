import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme } from '../lib/theme.ts';

beforeEach(() => {
  delete document.documentElement.dataset['theme'];
});

describe('applyTheme', () => {
  it('sets data-theme="dark" for dark mode', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('sets data-theme="light" for light mode', () => {
    applyTheme('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('removes data-theme for system mode', () => {
    document.documentElement.dataset['theme'] = 'dark';
    applyTheme('system');
    expect(document.documentElement.dataset['theme']).toBeUndefined();
  });

  it('switching from light to dark updates the attribute', () => {
    applyTheme('light');
    applyTheme('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
