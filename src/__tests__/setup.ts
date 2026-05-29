import { vi } from 'vitest';

// In-memory stores that back the chrome.storage mock
const stores: Record<'session' | 'sync', Record<string, unknown>> = {
  session: {},
  sync: {},
};

export function resetStorage(): void {
  stores.session = {};
  stores.sync = {};
}

(global as Record<string, unknown>)['chrome'] = {
  runtime: {
    onInstalled: { addListener: vi.fn() },
    onMessage: { addListener: vi.fn() },
    sendMessage: vi.fn(),
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
  },
  tabs: {
    update: vi.fn(),
    onRemoved: { addListener: vi.fn() },
  },
  webNavigation: {
    onBeforeNavigate: { addListener: vi.fn() },
  },
  storage: {
    sync: {
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(stores.sync, items);
      }),
      get: vi.fn(async (keys: string | string[]) => {
        const ks = typeof keys === 'string' ? [keys] : keys;
        return Object.fromEntries(
          ks.filter((k) => k in stores.sync).map((k) => [k, stores.sync[k]]),
        );
      }),
    },
    session: {
      set: vi.fn(async (items: Record<string, unknown>) => {
        Object.assign(stores.session, items);
      }),
      get: vi.fn(async (key: string) => {
        return key in stores.session ? { [key]: stores.session[key] } : {};
      }),
    },
  },
};
