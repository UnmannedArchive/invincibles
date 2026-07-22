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
    expect(simulateSeason(xi, 0, 5, null, DEFAULT_CONFIG)).toEqual(simulateSeason(xi, 0, 5));
  });

  test('season length follows the configured opponent list', async () => {
    const { DEFAULT_CONFIG } = await import('../lib/sim');
    const config = { ...DEFAULT_CONFIG, opponents: [70, 75, 80] };
    const r = simulateSeason(xiFor(0, 85), 0, 5, null, config);
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

describe('the fixture list', () => {
  test('faces every opponent home and away', () => {
    const r = simulateSeason(xiFor(0, 85), 0, 99);
    const counts = new Map<number, number>();
    for (const m of r.matches) counts.set(m.opponentIndex, (counts.get(m.opponentIndex) ?? 0) + 1);
    expect(counts.size).toBe(19);
    for (const n of counts.values()) expect(n).toBe(2);
  });

  // Fixtures used to run weakest-to-strongest, so every season ended against
  // the same two title rivals and the reveal was predictable.
  test('is ordered by the seed, not by opponent strength', () => {
    const a = simulateSeason(xiFor(0, 85), 0, 1).matches.map((m) => m.opponentIndex);
    const b = simulateSeason(xiFor(0, 85), 0, 2).matches.map((m) => m.opponentIndex);
    expect(a).not.toEqual(b);
    expect(a).not.toEqual([...a].sort((x, y) => x - y));
  });
});

describe('the final table', () => {
  test('has a row for every club plus you', () => {
    const r = simulateSeason(xiFor(0, 88), 0, 7);
    expect(r.table).toHaveLength(20);
    expect(r.table.filter((row) => row.isYou)).toHaveLength(1);
  });

  test('is sorted by points, then goal difference, then goals scored', () => {
    const r = simulateSeason(xiFor(0, 88), 0, 7);
    for (let i = 1; i < r.table.length; i++) {
      const above = r.table[i - 1];
      const below = r.table[i];
      const ordered =
        above.points > below.points ||
        (above.points === below.points &&
          (above.goalDiff > below.goalDiff ||
            (above.goalDiff === below.goalDiff && above.goalsFor >= below.goalsFor)));
      expect(ordered).toBe(true);
    }
  });

  test('puts you at your league position', () => {
    for (const seed of [3, 44, 512]) {
      const r = simulateSeason(xiFor(1, 84), 1, seed);
      expect(r.table[r.position - 1].isYou).toBe(true);
    }
  });

  test('reports your row with the same record as the season', () => {
    const r = simulateSeason(xiFor(0, 90), 0, 21);
    const you = r.table.find((row) => row.isYou)!;
    expect(you.points).toBe(r.points);
    expect(you.goalsFor).toBe(r.goalsFor);
    expect(you.goalDiff).toBe(r.goalsFor - r.goalsAgainst);
  });

  test('names the opposition', () => {
    const r = simulateSeason(xiFor(0, 85), 0, 5);
    for (const row of r.table) expect(row.name.length).toBeGreaterThan(2);
  });
});

describe('the manager', () => {
  const attacking = { id: 1, name: 'A', club: 'X', era: '1990s', rating: 90, style: 'attacking' as const, attack: 4, defense: 0 };
  const defensive = { id: 2, name: 'D', club: 'X', era: '1990s', rating: 90, style: 'defensive' as const, attack: 0, defense: 4 };

  test('changes the season a squad plays', () => {
    const xi = xiFor(0, 85);
    expect(simulateSeason(xi, 0, 99, attacking)).not.toEqual(simulateSeason(xi, 0, 99, null));
  });

  test('an attacking manager scores more than a defensive one', () => {
    let attackGoals = 0;
    let defenceGoals = 0;
    for (let seed = 0; seed < 40; seed++) {
      attackGoals += simulateSeason(xiFor(0, 85), 0, seed, attacking).goalsFor;
      defenceGoals += simulateSeason(xiFor(0, 85), 0, seed, defensive).goalsFor;
    }
    expect(attackGoals).toBeGreaterThan(defenceGoals);
  });

  test('a defensive manager concedes fewer than an attacking one', () => {
    let attackConceded = 0;
    let defenceConceded = 0;
    for (let seed = 0; seed < 40; seed++) {
      attackConceded += simulateSeason(xiFor(0, 85), 0, seed, attacking).goalsAgainst;
      defenceConceded += simulateSeason(xiFor(0, 85), 0, seed, defensive).goalsAgainst;
    }
    expect(defenceConceded).toBeLessThan(attackConceded);
  });

  test('no manager is the same as a manager with no bonuses', () => {
    const none = { ...attacking, attack: 0, defense: 0 };
    expect(simulateSeason(xiFor(0, 85), 0, 5, none)).toEqual(simulateSeason(xiFor(0, 85), 0, 5, null));
  });

  test('a good manager is worth points over a season', () => {
    let withManager = 0;
    let without = 0;
    for (let seed = 0; seed < 40; seed++) {
      withManager += simulateSeason(xiFor(0, 84), 0, seed, attacking).points;
      without += simulateSeason(xiFor(0, 84), 0, seed, null).points;
    }
    expect(withManager).toBeGreaterThan(without);
  });
});
