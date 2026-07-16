import { describe, expect, test } from 'vitest';
import { computeTier, simulateSeason } from '../lib/sim';
import { getFormation } from '../lib/formations';
import type { Player, Pos } from '../lib/types';

function xiFor(formationId: number, rating: number): Player[] {
  let id = 1;
  return getFormation(formationId).slots.map((slot) => ({
    id: id++,
    name: `Player ${id}`,
    pos: slot.pos as Pos,
    rating,
    club: 'Test FC',
    decade: '1990s',
  }));
}

describe('simulateSeason', () => {
  test('same XI, formation, and seed produce an identical season', () => {
    const xi = xiFor(0, 85);
    expect(simulateSeason(xi, 0, 12345)).toEqual(simulateSeason(xi, 0, 12345));
  });

  test('different seeds produce different seasons', () => {
    const xi = xiFor(0, 85);
    expect(simulateSeason(xi, 0, 1)).not.toEqual(simulateSeason(xi, 0, 2));
  });

  test('plays 38 matches with a consistent record and points', () => {
    const r = simulateSeason(xiFor(1, 80), 1, 777);
    expect(r.matches).toHaveLength(38);
    expect(r.wins + r.draws + r.losses).toBe(38);
    expect(r.points).toBe(3 * r.wins + r.draws);
    expect(r.goalsFor).toBe(r.matches.reduce((s, m) => s + m.goalsFor, 0));
    expect(r.goalsAgainst).toBe(r.matches.reduce((s, m) => s + m.goalsAgainst, 0));
    expect(r.position).toBeGreaterThanOrEqual(1);
    expect(r.position).toBeLessThanOrEqual(20);
  });

  test('rejects an XI that does not match the formation slots', () => {
    const xi = xiFor(0, 80); // 4-3-3 shaped
    expect(() => simulateSeason(xi, 2, 1)).toThrow(); // 3-5-2 wants different counts
    expect(() => simulateSeason(xi.slice(0, 10), 0, 1)).toThrow(); // only 10 players
  });

  test('a god-tier XI clearly outscores a weak XI across seeds', () => {
    let god = 0;
    let weak = 0;
    for (let seed = 0; seed < 30; seed++) {
      god += simulateSeason(xiFor(0, 97), 0, seed).points;
      weak += simulateSeason(xiFor(0, 55), 0, seed).points;
    }
    expect(god / 30).toBeGreaterThan(weak / 30 + 20);
  });

  test('tier is derived from the record', () => {
    const r = simulateSeason(xiFor(0, 99), 0, 42);
    expect(r.tier).toBe(computeTier(r.wins, r.draws, r.losses, r.position));
  });
});

describe('simulateSeason with a custom config', () => {
  test('explicit default config matches the implicit default', async () => {
    const xi = xiFor(0, 85);
    const { DEFAULT_CONFIG } = await import('../lib/sim');
    expect(simulateSeason(xi, 0, 5, DEFAULT_CONFIG)).toEqual(simulateSeason(xi, 0, 5));
  });

  test('season length follows the configured opponent list', async () => {
    const { DEFAULT_CONFIG } = await import('../lib/sim');
    const config = { ...DEFAULT_CONFIG, opponents: [70, 75, 80] };
    const r = simulateSeason(xiFor(0, 85), 0, 5, config);
    expect(r.matches).toHaveLength(6);
    expect(r.wins + r.draws + r.losses).toBe(6);
  });
});

describe('computeTier', () => {
  test('38 wins is a perfect season', () => {
    expect(computeTier(38, 0, 0, 1)).toBe('perfect');
  });

  test('unbeaten champions are invincible', () => {
    expect(computeTier(30, 8, 0, 1)).toBe('invincible');
  });

  test('champions with losses are just champions', () => {
    expect(computeTier(30, 5, 3, 1)).toBe('champions');
  });

  test('unbeaten but not champions earns nothing', () => {
    expect(computeTier(10, 28, 0, 3)).toBe('none');
  });

  test('a losing season earns nothing', () => {
    expect(computeTier(15, 10, 13, 8)).toBe('none');
  });
});
