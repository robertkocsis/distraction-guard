import { DEFAULT_SETTINGS } from '../types.ts';

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === 'install') {
    chrome.storage.sync.set({
      domains: [],
      settings: DEFAULT_SETTINGS,
    });
  }
});
