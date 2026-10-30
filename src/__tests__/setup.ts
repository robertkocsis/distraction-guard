import { vi } from 'vitest';

type Rule = chrome.declarativeNetRequest.Rule;
type UpdateRuleOptions = chrome.declarativeNetRequest.UpdateRuleOptions;

// In-memory stores that back the chrome.storage and declarativeNetRequest mocks
const stores: {
  sync: Record<string, unknown>;
  dynamicRules: Rule[];
  sessionRules: Rule[];
} = { sync: {}, dynamicRules: [], sessionRules: [] };

export function resetStorage(): void {
  stores.sync = {};
  stores.dynamicRules = [];
  stores.sessionRules = [];
}

export function getDynamicRules(): Rule[] {
  return stores.dynamicRules;
}

export function getSessionRules(): Rule[] {
  return stores.sessionRules;
}

function updateRules(key: 'dynamicRules' | 'sessionRules') {
  return vi.fn(
    async ({ removeRuleIds = [], addRules = [] }: UpdateRuleOptions) => {
      stores[key] = [
        ...stores[key].filter((r) => !removeRuleIds.includes(r.id)),
        ...addRules,
      ];
    },
  );
}

(global as Record<string, unknown>)['chrome'] = {
  runtime: {
    getURL: vi.fn((path: string) => `chrome-extension://test/${path}`),
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
  },
  declarativeNetRequest: {
    RuleActionType: { ALLOW: 'allow', REDIRECT: 'redirect' },
    ResourceType: { MAIN_FRAME: 'main_frame' },
    updateDynamicRules: updateRules('dynamicRules'),
    updateSessionRules: updateRules('sessionRules'),
    getSessionRules: vi.fn(
      async ({ ruleIds }: chrome.declarativeNetRequest.GetRulesFilter = {}) =>
        stores.sessionRules.filter((r) => !ruleIds || ruleIds.includes(r.id)),
    ),
  },
};
