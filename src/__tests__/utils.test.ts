import { describe, it, expect } from 'vitest';
import { extractDomain, escape, generateChallenge } from '../utils.ts';
import { WORDS } from '../words.ts';

describe('extractDomain', () => {
  it('returns the hostname', () => {
    expect(extractDomain('https://reddit.com/r/programming')).toBe(
      'reddit.com',
    );
  });

  it('strips www', () => {
    expect(extractDomain('https://www.reddit.com')).toBe('reddit.com');
  });

  it('preserves non-www subdomains', () => {
    expect(extractDomain('https://old.reddit.com')).toBe('old.reddit.com');
  });

  it('handles http', () => {
    expect(extractDomain('http://example.com/page?q=1')).toBe('example.com');
  });

  it('returns empty string for invalid URLs', () => {
    expect(extractDomain('not a url')).toBe('');
    expect(extractDomain('')).toBe('');
  });
});

describe('escape', () => {
  it('escapes ampersands', () => {
    expect(escape('a & b')).toBe('a &amp; b');
  });

  it('escapes less-than', () => {
    expect(escape('<script>')).toBe('&lt;script&gt;');
  });

  it('escapes greater-than', () => {
    expect(escape('x > y')).toBe('x &gt; y');
  });

  it('escapes all three in one string', () => {
    expect(escape('<a href="x&y">test</a>')).toBe(
      '&lt;a href="x&amp;y"&gt;test&lt;/a&gt;',
    );
  });

  it('returns plain strings unchanged', () => {
    expect(escape('hello world')).toBe('hello world');
  });
});

describe('generateChallenge', () => {
  it('returns the requested number of words', () => {
    const result = generateChallenge(10);
    expect(result.split(' ')).toHaveLength(10);
  });

  it('returns only words from the word list', () => {
    const words = generateChallenge(20).split(' ');
    words.forEach((w) => expect(WORDS).toContain(w));
  });

  it('returns no duplicate words within one challenge', () => {
    const words = generateChallenge(30).split(' ');
    expect(new Set(words).size).toBe(words.length);
  });

  it('clamps to the word list size', () => {
    const result = generateChallenge(99999).split(' ');
    expect(result.length).toBeLessThanOrEqual(WORDS.length);
  });

  it('words are joined by single spaces', () => {
    const result = generateChallenge(5);
    expect(result).not.toMatch(/\s{2,}/);
  });
});
