import { WORDS } from './words.ts';

export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

// True if `domain` matches a blocked entry exactly or is a subdomain of one
// (so `reddit.com` blocks `old.reddit.com` but not `notreddit.com`).
export function isBlocked(domain: string, blockedDomains: string[]): boolean {
  return blockedDomains.some((d) => domain === d || domain.endsWith(`.${d}`));
}

export function generateChallenge(wordCount: number): string {
  const count = Math.min(wordCount, WORDS.length);
  const pool = [...WORDS];
  // Fisher–Yates: unbiased, unlike sort() with a random comparator
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j]!, pool[i]!];
  }
  return pool.slice(0, count).join(' ');
}

export function escape(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
