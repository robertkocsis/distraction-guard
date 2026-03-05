import { describe, it, expect, beforeEach } from 'vitest';
import { handlePageLoad, handleAddUnlocked } from '../background/worker.ts';
import { resetStorage } from './setup.ts';

beforeEach(resetStorage);

describe('handlePageLoad', () => {
  it('returns unlocked:false when the tab has no stored unlock', async () => {
    const result = await handlePageLoad('tab1', 'reddit.com');
    expect(result).toEqual({ unlocked: false });
  });

  it('returns unlocked:true after the domain has been unlocked', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    const result = await handlePageLoad('tab1', 'reddit.com');
    expect(result).toEqual({ unlocked: true });
  });

  it('clears the unlock when navigating to a different domain', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    // tab navigates to youtube.com
    await handlePageLoad('tab1', 'youtube.com');
    // navigating back to reddit.com should be locked again
    const result = await handlePageLoad('tab1', 'reddit.com');
    expect(result).toEqual({ unlocked: false });
  });

  it('does not clear unlock when navigating within the same domain', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    const result = await handlePageLoad('tab1', 'reddit.com');
    expect(result).toEqual({ unlocked: true });
  });

  it('isolates unlocks per tab', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    const tab2Result = await handlePageLoad('tab2', 'reddit.com');
    expect(tab2Result).toEqual({ unlocked: false });
  });

  it('does not affect other tabs when clearing', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    await handleAddUnlocked('tab2', 'reddit.com');
    // tab1 navigates away
    await handlePageLoad('tab1', 'google.com');
    // tab2 should still be unlocked
    const tab2Result = await handlePageLoad('tab2', 'reddit.com');
    expect(tab2Result).toEqual({ unlocked: true });
  });
});

describe('handleAddUnlocked', () => {
  it('stores the domain for the given tab', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    const result = await handlePageLoad('tab1', 'reddit.com');
    expect(result).toEqual({ unlocked: true });
  });

  it('overwrites a previously stored domain', async () => {
    await handleAddUnlocked('tab1', 'reddit.com');
    await handleAddUnlocked('tab1', 'youtube.com');
    // only youtube.com should be unlocked after the overwrite
    expect(await handlePageLoad('tab1', 'youtube.com')).toEqual({
      unlocked: true,
    });
  });
});
