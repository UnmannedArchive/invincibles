import { describe, expect, test } from 'vitest';
import {
  newRun,
  eligibleInPool,
  firstOpenSlotFor,
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
    expect(() => applyPick(run, GK_SLOT, fw.id)).toThrow();
  });
});

describe('a full run', () => {
  test('completes with 11 picks and yields a valid XI for the sim', () => {
    let run = newRun(0);
    const rng = mulberry32(99);
    let guard = 0;
    while (!isComplete(run) && guard++ < 1000) {
      const key = spinPool(rng);
      const eligible = eligibleInPool(run, getPool(key.club, key.decade));
      if (eligible.length === 0) continue;
      const player = eligible[0];
      run = applyPick(run, firstOpenSlotFor(run, player.pos), player.id);
    }
    expect(isComplete(run)).toBe(true);
    const xi = orderedXI(run);
    expect(xi).toHaveLength(11);
    // XI position multiset matches the formation slot multiset
    expect(xi.map((p) => p.pos)).toEqual(getFormation(0).slots.map((s) => s.pos));
  });

  // The one bug that would ruin a run outright: a position nobody in the pool
  // can fill. Pool minimums are meant to make it impossible.
  test('never dead-ends across many seeded playthroughs', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const fid of [0, 1, 2]) {
        let run = newRun(fid);
        const rng = mulberry32(seed * 7 + fid);
        let guard = 0;
        while (!isComplete(run) && guard++ < 500) {
          const key = spinPool(rng);
          const eligible = eligibleInPool(run, getPool(key.club, key.decade));
          if (eligible.length === 0) continue;
          const player = eligible[Math.floor(rng() * eligible.length)];
          run = applyPick(run, firstOpenSlotFor(run, player.pos), player.id);
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
const GK_SLOT = 0; // GK is slot 0 in every formation
function firstOpen(run: ReturnType<typeof newRun>, pos: Player['pos']): number {
  const formation = getFormation(run.formationId);
  const slot = formation.slots.findIndex((s, i) => s.pos === pos && run.picks[i] === null);
  if (slot === -1) throw new Error(`no open ${pos} slot`);
  return slot;
}
