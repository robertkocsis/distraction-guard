import { handleNavigation, lockTab, syncBlockRule } from '../lib/rules.ts';

// Dynamic rules persist, so the block rule only needs rebuilding on
// install/update (the rule format may have changed) and when the list changes.
chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get('domains');
  await syncBlockRule((result['domains'] as string[] | undefined) ?? []);
});

chrome.storage.sync.onChanged.addListener((changes) => {
  const domains = changes['domains'];
  if (domains) {
    void syncBlockRule((domains.newValue as string[] | undefined) ?? []);
  }
});

chrome.webNavigation.onCommitted.addListener(({ frameId, tabId, url }) => {
  if (frameId === 0) void handleNavigation(tabId, url);
});

// Drop a tab's unlock when it closes so session rules don't accumulate
chrome.tabs.onRemoved.addListener((tabId) => {
  void lockTab(tabId);
});
