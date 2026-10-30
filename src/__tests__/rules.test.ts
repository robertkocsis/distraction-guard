import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleNavigation,
  lockTab,
  syncBlockRule,
  unlockTab,
} from '../lib/rules.ts';
import { getDynamicRules, getSessionRules, resetStorage } from './setup.ts';

beforeEach(resetStorage);

function unlockedTabs(): number[] {
  return getSessionRules().map((r) => r.id);
}

describe('syncBlockRule', () => {
  it('adds one redirect rule covering every blocked domain', async () => {
    await syncBlockRule(['reddit.com', 'youtube.com']);
    const [rule, ...rest] = getDynamicRules();
    expect(rest).toEqual([]);
    expect(rule?.condition.requestDomains).toEqual([
      'reddit.com',
      'youtube.com',
    ]);
    expect(rule?.condition.resourceTypes).toEqual(['main_frame']);
  });

  it('redirects to the block page with the original URL in the hash', async () => {
    await syncBlockRule(['reddit.com']);
    expect(getDynamicRules()[0]?.action.redirect?.regexSubstitution).toBe(
      'chrome-extension://test/src/block/block.html#\\0',
    );
  });

  it('replaces the previous rule instead of adding another', async () => {
    await syncBlockRule(['reddit.com']);
    await syncBlockRule(['youtube.com']);
    expect(getDynamicRules().map((r) => r.condition.requestDomains)).toEqual([
      ['youtube.com'],
    ]);
  });

  it('removes the rule when the list is empty', async () => {
    await syncBlockRule(['reddit.com']);
    await syncBlockRule([]);
    expect(getDynamicRules()).toEqual([]);
  });

  it('normalizes, dedupes and drops invalid entries', async () => {
    await syncBlockRule([
      'https://www.Reddit.com/r/all',
      'reddit.com',
      'not a domain',
    ]);
    expect(getDynamicRules()[0]?.condition.requestDomains).toEqual([
      'reddit.com',
    ]);
  });

  it('removes the rule when no entry is valid', async () => {
    await syncBlockRule(['reddit.com']);
    await syncBlockRule(['not a domain']);
    expect(getDynamicRules()).toEqual([]);
  });
});

describe('unlockTab', () => {
  it('adds an allow rule scoped to the tab and domain', async () => {
    await unlockTab(7, 'reddit.com');
    const [rule] = getSessionRules();
    expect(rule?.id).toBe(7);
    expect(rule?.action.type).toBe('allow');
    expect(rule?.condition.tabIds).toEqual([7]);
    expect(rule?.condition.requestDomains).toEqual(['reddit.com']);
  });

  it('outranks the block rule', async () => {
    await syncBlockRule(['reddit.com']);
    await unlockTab(7, 'reddit.com');
    expect(getSessionRules()[0]!.priority).toBeGreaterThan(
      getDynamicRules()[0]!.priority!,
    );
  });

  it('overwrites the previous unlock for the same tab', async () => {
    await unlockTab(7, 'reddit.com');
    await unlockTab(7, 'youtube.com');
    expect(getSessionRules().map((r) => r.condition.requestDomains)).toEqual([
      ['youtube.com'],
    ]);
  });
});

describe('lockTab', () => {
  it('removes only that tab’s unlock', async () => {
    await unlockTab(1, 'reddit.com');
    await unlockTab(2, 'reddit.com');
    await lockTab(1);
    expect(unlockedTabs()).toEqual([2]);
  });

  it('is a no-op for a tab with no unlock', async () => {
    await expect(lockTab(9)).resolves.toBeUndefined();
  });
});

describe('handleNavigation', () => {
  it('keeps the unlock within the same domain', async () => {
    await unlockTab(1, 'reddit.com');
    await handleNavigation(1, 'https://www.reddit.com/r/all');
    expect(unlockedTabs()).toEqual([1]);
  });

  it('keeps the unlock on a subdomain of the unlocked domain', async () => {
    await unlockTab(1, 'reddit.com');
    await handleNavigation(1, 'https://old.reddit.com/');
    expect(unlockedTabs()).toEqual([1]);
  });

  it('clears the unlock when the tab leaves the domain', async () => {
    await unlockTab(1, 'reddit.com');
    await handleNavigation(1, 'https://google.com/');
    expect(unlockedTabs()).toEqual([]);
  });

  it('does not treat a lookalike domain as the same site', async () => {
    await unlockTab(1, 'reddit.com');
    await handleNavigation(1, 'https://notreddit.com/');
    expect(unlockedTabs()).toEqual([]);
  });

  it('does not affect other tabs', async () => {
    await unlockTab(1, 'reddit.com');
    await unlockTab(2, 'reddit.com');
    await handleNavigation(1, 'https://google.com/');
    expect(unlockedTabs()).toEqual([2]);
  });

  it('is a no-op for a tab with no unlock', async () => {
    await handleNavigation(1, 'https://google.com/');
    expect(unlockedTabs()).toEqual([]);
  });
});
