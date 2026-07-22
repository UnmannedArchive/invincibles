import { describe, expect, test } from 'vitest';
import { LEAGUE, opponentName } from '../lib/opponents';
import { DEFAULT_CONFIG } from '../lib/sim';

describe('the league', () => {
  test('fields one club per configured opponent strength, in order', () => {
    expect(LEAGUE.map((c) => c.strength)).toEqual(DEFAULT_CONFIG.opponents);
  });

  test('gives every club a distinct name and three-letter code', () => {
    expect(new Set(LEAGUE.map((c) => c.name)).size).toBe(LEAGUE.length);
    expect(new Set(LEAGUE.map((c) => c.short)).size).toBe(LEAGUE.length);
    for (const club of LEAGUE) {
      expect(club.short).toMatch(/^[A-Z]{3}$/);
      expect(club.name.trim()).toBe(club.name);
    }
  });

  test('names an opponent by index', () => {
    expect(opponentName(0)).toBe(LEAGUE[0].name);
    expect(opponentName(LEAGUE.length - 1)).toBe(LEAGUE[LEAGUE.length - 1].name);
  });

  // Custom sim configs (tuning, tests) can run shorter leagues than the real one.
  test('falls back to a generic name for an out-of-range index', () => {
    expect(opponentName(99)).toBeTruthy();
    expect(opponentName(99)).not.toBe(opponentName(98));
  });
});
