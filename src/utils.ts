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

const HOSTNAME = /^[a-z0-9-]+(\.[a-z0-9-]+)*$/;

// Turn user input like ` https://www.Reddit.com/r/all` into a bare hostname
// (`reddit.com`), or '' if it isn't one. Hostnames come out lowercase and
// punycoded, which is what declarativeNetRequest's `requestDomains` expects.
export function normalizeDomain(raw: string): string {
  const input = raw.trim();
  const domain = extractDomain(
    input.includes('://') ? input : `https://${input}`,
  );
  return HOSTNAME.test(domain) ? domain : '';
}
