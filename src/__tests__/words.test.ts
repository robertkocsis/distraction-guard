import { describe, it, expect } from 'vitest';
import { WORDS } from '../words.ts';

describe('WORDS', () => {
  it('contains at least 500 words', () => {
    expect(WORDS.length).toBeGreaterThanOrEqual(500);
  });

  it('has no duplicate entries', () => {
    expect(new Set(WORDS).size).toBe(WORDS.length);
  });

  it('every entry is a non-empty lowercase string', () => {
    for (const word of WORDS) {
      expect(typeof word).toBe('string');
      expect(word.length).toBeGreaterThan(0);
      expect(word).toBe(word.toLowerCase());
    }
  });

  it('no entry contains whitespace', () => {
    for (const word of WORDS) {
      expect(word).not.toMatch(/\s/);
    }
  });
});
