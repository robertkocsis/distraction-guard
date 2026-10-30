import type { Theme } from '../types.ts';

export function applyTheme(theme: Theme): void {
  if (theme === 'system') {
    delete document.documentElement.dataset['theme'];
  } else {
    document.documentElement.dataset['theme'] = theme;
  }
}
