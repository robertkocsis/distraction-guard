import { DEFAULT_SETTINGS } from '../types.ts';
import { extractDomain, isBlocked } from '../utils.ts';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.sync.set({
      domains: [],
      settings: DEFAULT_SETTINGS,
    });
  }
});

async function getTabUnlocks(): Promise<Record<string, string>> {
  const result = await chrome.storage.session.get('tabUnlocks');
  return (result['tabUnlocks'] as Record<string, string> | undefined) ?? {};
}

async function setTabUnlocks(unlocks: Record<string, string>): Promise<void> {
  await chrome.storage.session.set({ tabUnlocks: unlocks });
}

export async function handlePageLoad(
  tabId: string,
  domain: string,
): Promise<{ unlocked: boolean }> {
  const unlocks = await getTabUnlocks();
  if (unlocks[tabId] && unlocks[tabId] !== domain) {
    delete unlocks[tabId];
    await setTabUnlocks(unlocks);
  }
  return { unlocked: unlocks[tabId] === domain };
}

export async function handleAddUnlocked(
  tabId: string,
  domain: string,
): Promise<void> {
  const unlocks = await getTabUnlocks();
  unlocks[tabId] = domain;
  await setTabUnlocks(unlocks);
}

export async function handleTabRemoved(tabId: string): Promise<void> {
  const unlocks = await getTabUnlocks();
  if (tabId in unlocks) {
    delete unlocks[tabId];
    await setTabUnlocks(unlocks);
  }
}

// Drop a tab's unlock when it closes so session state doesn't accumulate
chrome.tabs.onRemoved.addListener((tabId) => {
  void handleTabRemoved(String(tabId));
});

// Intercept navigations to blocked domains and redirect to the block page,
// preventing the target page from loading at all.
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return;
  if (
    details.url.startsWith('chrome-extension://') ||
    details.url.startsWith('chrome://')
  )
    return;

  const domain = extractDomain(details.url);
  if (!domain) return;

  const tabId = String(details.tabId);

  // Clear the unlock whenever the user navigates to a different domain
  const unlocks = await getTabUnlocks();
  if (unlocks[tabId] && unlocks[tabId] !== domain) {
    delete unlocks[tabId];
    await setTabUnlocks(unlocks);
  }

  // Already unlocked for this domain — let the navigation through
  if (unlocks[tabId] === domain) return;

  // Check if this domain is in the blocked list
  const result = await chrome.storage.sync.get(['domains']);
  const blockedDomains = (result['domains'] as string[] | undefined) ?? [];
  if (!isBlocked(domain, blockedDomains)) return;

  // Redirect to the block page — the original site never loads
  const blockUrl =
    chrome.runtime.getURL('src/block/block.html') +
    `?url=${encodeURIComponent(details.url)}&domain=${encodeURIComponent(domain)}&tabId=${details.tabId}`;
  void chrome.tabs.update(details.tabId, { url: blockUrl });
});

chrome.runtime.onMessage.addListener(
  (
    message: { type: string; domain: string; tabId?: string },
    sender,
    sendResponse,
  ) => {
    // tabId can be passed explicitly from extension pages (block.html has no sender.tab)
    const tabId = message.tabId ?? String(sender.tab?.id ?? '');
    if (!tabId) {
      sendResponse({});
      return;
    }

    if (message.type === 'PAGE_LOAD') {
      handlePageLoad(tabId, message.domain).then(sendResponse);
      return true;
    }

    if (message.type === 'ADD_UNLOCKED') {
      handleAddUnlocked(tabId, message.domain).then(() =>
        sendResponse({ ok: true }),
      );
      return true;
    }
  },
);
