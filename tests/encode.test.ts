import { describe, expect, test } from 'vitest';
import { encodeRun, decodeRun, sharedFromRun, type SharedRun } from '../lib/encode';
import { newRun, applyPick, orderedXI } from '../lib/run';
import { getPool } from '../lib/data';
import { simulateSeason } from '../lib/sim';
import { seasonSeed } from '../lib/seed';
import { getFormation } from '../lib/formations';

function sampleShared(): SharedRun {
  return { formationId: 2, playerIds: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110] };
}

function fillFrom(formationId: number, club: string, decade: string) {
  let run = newRun(formationId);
  const pool = getPool(club, decade);
  for (let slot = 0; slot < 11; slot++) {
    const pos = getFormation(formationId).slots[slot].pos;
    const player = pool.find((p) => p.pos === pos && !run.picks.includes(p.id))!;
    run = applyPick(run, slot, player.id);
  }
  return run;
}

describe('encodeRun / decodeRun', () => {
  test('round-trips a shared run exactly', () => {
    const shared = sampleShared();
    expect(decodeRun(encodeRun(shared))).toEqual(shared);
  });

  test('produces a URL-safe code (no +, /, or =)', () => {
    expect(encodeRun(sampleShared())).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  // The seed is derived from the XI, never transmitted. If it ever creeps back
  // into the code, anyone can grind seeds and mint themselves a perfect season.
  test('carries no seed', () => {
    const code = encodeRun(sampleShared());
    expect(code).toHaveLength(32);
    expect(decodeRun(code)).not.toHaveProperty('seed');
  });

  test('round-trips the largest player ids', () => {
    const shared: SharedRun = {
      formationId: 1,
      playerIds: [65535, 6160, 5000, 4001, 3500, 3001, 2500, 2001, 1500, 500, 0],
    };
    expect(decodeRun(encodeRun(shared))).toEqual(shared);
  });

  test('different runs encode to different codes', () => {
    const a = encodeRun(sampleShared());
    const b = encodeRun({ ...sampleShared(), formationId: 1 });
    expect(a).not.toBe(b);
  });

  test('rejects a malformed code', () => {
    expect(() => decodeRun('not-a-real-code!!')).toThrow();
    expect(() => decodeRun('')).toThrow();
  });

  test('rejects a truncated code', () => {
    const good = encodeRun(sampleShared());
    expect(() => decodeRun(good.slice(0, 4))).toThrow();
  });

  // Old links encoded a seed and ran 38 characters. They must fail loudly
  // rather than quietly decode into some other XI.
  test('rejects a code from the previous version', () => {
    expect(() => decodeRun('A'.repeat(38))).toThrow();
  });

  test('rejects an XI that is not 11 players', () => {
    expect(() => encodeRun({ formationId: 0, playerIds: [1, 2, 3] })).toThrow();
  });
});

describe('sharedFromRun', () => {
  test('captures the formation and XI order of a completed run', () => {
    const run = fillFrom(0, 'Barcelona', '2010s');
    const shared = sharedFromRun(run);
    expect(shared.formationId).toBe(0);
    expect(shared.playerIds).toEqual(orderedXI(run).map((p) => p.id));
  });

  test('a decoded run replays to the same season', () => {
    const run = fillFrom(0, 'Barcelona', '2010s');
    const shared = sharedFromRun(run);
    const xi = orderedXI(run);
    const original = simulateSeason(
      xi,
      shared.formationId,
      seasonSeed(shared.formationId, shared.playerIds),
    );

    const decoded = decodeRun(encodeRun(shared));
    const replay = simulateSeason(
      decoded.playerIds.map((id) => xi.find((p) => p.id === id)!),
      decoded.formationId,
      seasonSeed(decoded.formationId, decoded.playerIds),
    );
    expect(replay).toEqual(original);
  });

  // Same eleven players, different slot order within a line: still one season.
  test('reordering equivalent players does not change the season', () => {
    const run = fillFrom(0, 'Barcelona', '2010s');
    const swapped = { ...run, picks: run.picks.slice() };
    [swapped.picks[1], swapped.picks[2]] = [swapped.picks[2], swapped.picks[1]];

    const a = sharedFromRun(run);
    const b = sharedFromRun(swapped);
    expect(seasonSeed(a.formationId, a.playerIds)).toBe(
      seasonSeed(b.formationId, b.playerIds),
    );
  });
});
