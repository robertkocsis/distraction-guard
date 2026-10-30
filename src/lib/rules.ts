import { extractDomain, isBlocked, normalizeDomain } from '../utils.ts';

// Blocking is done entirely with declarativeNetRequest rules, so Chrome
// redirects a blocked navigation before any request is sent:
// - one dynamic rule (persists across restarts) redirects main-frame requests
//   for every blocked domain to the block page, with the original URL in the
//   hash;
// - one session rule per unlocked tab (cleared when the browser closes) allows
//   that tab's unlocked domain. Its rule id is the tab id, so a tab holds at
//   most one unlock.

const BLOCK_RULE_ID = 1;

export async function syncBlockRule(domains: string[]): Promise<void> {
  // Normalize again here: one invalid entry (e.g. synced from an older
  // version) would make Chrome reject the whole rule and unblock everything.
  const requestDomains = [...new Set(domains.map(normalizeDomain))].filter(
    Boolean,
  );
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [BLOCK_RULE_ID],
    addRules:
      requestDomains.length === 0
        ? []
        : [
            {
              id: BLOCK_RULE_ID,
              priority: 1,
              action: {
                type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
                redirect: {
                  regexSubstitution: `${chrome.runtime.getURL('src/block/block.html')}#\\0`,
                },
              },
              condition: {
                regexFilter: '^.+$',
                requestDomains,
                resourceTypes: [
                  chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                ],
              },
            },
          ],
  });
}

export async function unlockTab(tabId: number, domain: string): Promise<void> {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [tabId],
    addRules: [
      {
        id: tabId,
        // Outranks the block rule
        priority: 2,
        action: { type: chrome.declarativeNetRequest.RuleActionType.ALLOW },
        condition: {
          tabIds: [tabId],
          requestDomains: [domain],
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      },
    ],
  });
}

export async function lockTab(tabId: number): Promise<void> {
  await chrome.declarativeNetRequest.updateSessionRules({
    removeRuleIds: [tabId],
  });
}

// Re-lock a tab as soon as it commits a page outside its unlocked domain.
export async function handleNavigation(
  tabId: number,
  url: string,
): Promise<void> {
  const [rule] = await chrome.declarativeNetRequest.getSessionRules({
    ruleIds: [tabId],
  });
  const unlocked = rule?.condition.requestDomains?.[0];
  if (unlocked && !isBlocked(extractDomain(url), [unlocked])) {
    await lockTab(tabId);
  }
}
