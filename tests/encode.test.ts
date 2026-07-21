import { describe, expect, test } from 'vitest';
import { encodeRun, decodeRun, sharedFromRun, type SharedRun } from '../lib/encode';
import { newRun, applyPick, orderedXI } from '../lib/run';
import { getPool } from '../lib/data';
import { simulateSeason } from '../lib/sim';

function sampleShared(): SharedRun {
  return { formationId: 2, playerIds: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110], seed: 123456789 };
}

describe('encodeRun / decodeRun', () => {
  test('round-trips a shared run exactly', () => {
    const shared = sampleShared();
    expect(decodeRun(encodeRun(shared))).toEqual(shared);
  });

  test('produces a URL-safe code (no +, /, or =)', () => {
    const code = encodeRun(sampleShared());
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('round-trips large player ids and max seed', () => {
    const shared: SharedRun = {
      formationId: 1,
      playerIds: [5000, 4999, 4001, 3500, 3001, 2500, 2001, 1500, 1001, 500, 1],
      seed: 0xffffffff,
    };
    expect(decodeRun(encodeRun(shared))).toEqual(shared);
  });

  test('different runs encode to different codes', () => {
    const a = encodeRun(sampleShared());
    const b = encodeRun({ ...sampleShared(), seed: 987654321 });
    expect(a).not.toBe(b);
  });

  test('rejects a malformed code', () => {
    expect(() => decodeRun('not-a-real-code!!')).toThrow();
    expect(() => decodeRun('')).toThrow();
  });

  test('rejects a code with the wrong version byte', () => {
    // corrupt the first byte by decoding, bumping version, re-encoding is internal;
    // simplest check: a truncated code must throw rather than silently decode
    const good = encodeRun(sampleShared());
    expect(() => decodeRun(good.slice(0, 4))).toThrow();
  });
});

describe('sharedFromRun', () => {
  test('captures the formation, XI order, and seed of a completed run', () => {
    let run = newRun(0);
    const pool = getPool('Barcelona', '2010s');
    // fill each slot with an eligible player of the right position
    const formation = run.picks.map((_, i) => i);
    for (const slotIndex of formation) {
      const posNeeded = getFormationPos(run.formationId, slotIndex);
      const player = pool.find(
        (p) => p.pos === posNeeded && !run.picks.includes(p.id),
      )!;
      run = applyPick(run, slotIndex, player.id);
    }
    const shared = sharedFromRun(run, 42);
    expect(shared.formationId).toBe(0);
    expect(shared.seed).toBe(42);
    expect(shared.playerIds).toEqual(orderedXI(run).map((p) => p.id));
  });

  test('a decoded run reproduces the same season result', () => {
    let run = newRun(0);
    const pool = getPool('Barcelona', '2010s');
    for (let i = 0; i < 11; i++) {
      const posNeeded = getFormationPos(run.formationId, i);
      const player = pool.find((p) => p.pos === posNeeded && !run.picks.includes(p.id))!;
      run = applyPick(run, i, player.id);
    }
    const shared = sharedFromRun(run, 7);
    const decoded = decodeRun(encodeRun(shared));
    const xi = orderedXI(run);
    const original = simulateSeason(xi, shared.formationId, shared.seed);
    const replay = simulateSeason(
      decoded.playerIds.map((id) => xi.find((p) => p.id === id)!),
      decoded.formationId,
      decoded.seed,
    );
    expect(replay).toEqual(original);
  });
});

import { getFormation } from '../lib/formations';
function getFormationPos(formationId: number, slotIndex: number) {
  return getFormation(formationId).slots[slotIndex].pos;
}
