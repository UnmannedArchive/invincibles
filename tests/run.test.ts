import { describe, expect, test } from 'vitest';
import {
  newRun,
  openSlots,
  eligibleInPool,
  applyPick,
  isComplete,
  orderedXI,
  spinPool,
} from '../lib/run';
import { getFormation } from '../lib/formations';
import { getPool, POOL_KEYS } from '../lib/data';
import { mulberry32 } from '../lib/rng';
import type { Player } from '../lib/types';

describe('newRun', () => {
  test('starts with every slot open for the chosen formation', () => {
    const run = newRun(0);
    expect(run.picks).toHaveLength(11);
    expect(run.picks.every((p) => p === null)).toBe(true);
    expect(openSlots(run)).toHaveLength(11);
  });
});

describe('eligibleInPool', () => {
  test('returns only players whose position matches an open slot', () => {
    const run = newRun(0); // 4-3-3: all slots open
    const pool = getPool('Arsenal', '2000s');
    const eligible = eligibleInPool(run, pool);
    // all four positions have open slots, so the whole pool is eligible
    expect(eligible.length).toBe(pool.length);
  });

  test('excludes players already picked', () => {
    const run = newRun(0);
    const pool = getPool('Arsenal', '2000s');
    const gk = pool.find((p) => p.pos === 'GK')!;
    const after = applyPick(run, gkSlot(0), gk.id);
    const eligible = eligibleInPool(after, pool);
    expect(eligible.find((p) => p.id === gk.id)).toBeUndefined();
  });

  test('excludes positions with no open slot left', () => {
    let run = newRun(0); // 4-3-3 has exactly 1 GK slot
    const pool = getPool('Arsenal', '2000s');
    const gk = pool.find((p) => p.pos === 'GK')!;
    run = applyPick(run, gkSlot(0), gk.id);
    // GK slot now filled; no GK from any pool should be eligible
    const otherPool = getPool('Chelsea', '2000s');
    expect(eligibleInPool(run, otherPool).some((p) => p.pos === 'GK')).toBe(false);
  });
});

describe('applyPick', () => {
  test('is immutable and fills the target slot', () => {
    const run = newRun(1);
    const pool = getPool('Liverpool', '2010s');
    const df = pool.find((p) => p.pos === 'DF')!;
    const slot = firstOpen(run, 'DF');
    const after = applyPick(run, slot, df.id);
    expect(run.picks[slot]).toBeNull(); // original untouched
    expect(after.picks[slot]).toBe(df.id);
  });

  test('rejects a player whose position does not match the slot', () => {
    const run = newRun(0);
    const pool = getPool('Arsenal', '2000s');
    const fw = pool.find((p) => p.pos === 'FW')!;
    expect(() => applyPick(run, gkSlot(0), fw.id)).toThrow();
  });
});

describe('a full run', () => {
  test('completes with 11 picks and yields a valid XI for the sim', () => {
    let run = newRun(0);
    const rng = mulberry32(99);
    let guard = 0;
    while (!isComplete(run) && guard++ < 1000) {
      const key = spinPool(rng);
      const pool = getPool(key.club, key.decade);
      const eligible = eligibleInPool(run, pool);
      if (eligible.length === 0) continue; // shouldn't happen, but skip defensively
      const player = eligible[0];
      const slot = firstOpen(run, player.pos);
      run = applyPick(run, slot, player.id);
    }
    expect(isComplete(run)).toBe(true);
    const xi = orderedXI(run);
    expect(xi).toHaveLength(11);
    // XI position multiset matches the formation slot multiset
    const formation = getFormation(0);
    expect(xi.map((p) => p.pos)).toEqual(formation.slots.map((s) => s.pos));
  });

  test('never dead-ends across many seeded playthroughs', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const fid of [0, 1, 2]) {
        let run = newRun(fid);
        const rng = mulberry32(seed * 7 + fid);
        let guard = 0;
        while (!isComplete(run) && guard++ < 500) {
          const key = spinPool(rng);
          const pool = getPool(key.club, key.decade);
          const eligible = eligibleInPool(run, pool);
          if (eligible.length === 0) continue;
          const player = eligible[Math.floor(rng() * eligible.length)];
          run = applyPick(run, firstOpen(run, player.pos), player.id);
        }
        expect(isComplete(run)).toBe(true);
      }
    }
  });
});

describe('spinPool', () => {
  test('always returns a real pool key', () => {
    const rng = mulberry32(3);
    for (let i = 0; i < 50; i++) {
      const key = spinPool(rng);
      expect(POOL_KEYS.some((k) => k.club === key.club && k.decade === key.decade)).toBe(true);
    }
  });
});

// helpers
function gkSlot(_n: number): number {
  return 0; // GK is slot 0 in every formation
}
function firstOpen(run: ReturnType<typeof newRun>, pos: Player['pos']): number {
  const formation = getFormation(run.formationId);
  const slot = formation.slots.findIndex((s, i) => s.pos === pos && run.picks[i] === null);
  if (slot === -1) throw new Error(`no open ${pos} slot`);
  return slot;
}
