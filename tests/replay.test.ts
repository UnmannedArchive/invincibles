import { describe, expect, test } from 'vitest';
import { playRun, replayFromCode } from '../lib/replay';
import { encodeRun, sharedFromRun } from '../lib/encode';
import { newRun, applyPick, orderedXI } from '../lib/run';
import { getPool } from '../lib/data';
import { getFormation } from '../lib/formations';
import { simulateSeason } from '../lib/sim';
import { seasonSeed } from '../lib/seed';

function fill(formationId: number, club: string, decade: string) {
  let run = newRun(formationId);
  const pool = getPool(club, decade);
  for (let slot = 0; slot < 11; slot++) {
    const pos = getFormation(formationId).slots[slot].pos;
    const player = pool.find((p) => p.pos === pos && !run.picks.includes(p.id))!;
    run = applyPick(run, slot, player.id);
  }
  return run;
}

describe('playRun', () => {
  test('plays the season the XI is entitled to, every time', () => {
    const run = fill(0, 'Liverpool', '1980s');
    const ids = orderedXI(run).map((p) => p.id);
    expect(playRun(run)).toEqual(
      simulateSeason(orderedXI(run), run.formationId, seasonSeed(run.formationId, ids)),
    );
    expect(playRun(run)).toEqual(playRun(run));
  });
});

describe('replayFromCode', () => {
  test('rebuilds the exact season behind a share code', () => {
    const run = fill(0, 'Liverpool', '1980s');
    const replay = replayFromCode(encodeRun(sharedFromRun(run)))!;
    expect(replay).not.toBeNull();
    expect(replay.result).toEqual(playRun(run));
    expect(replay.run).toEqual({ formationId: run.formationId, picks: run.picks, managerId: null });
  });

  test('returns null for a code that is not a code', () => {
    expect(replayFromCode('')).toBeNull();
    expect(replayFromCode('nonsense!!')).toBeNull();
    expect(replayFromCode('A'.repeat(38))).toBeNull();
  });

  test('returns null when a code names a player who does not exist', () => {
    const code = encodeRun({ formationId: 0, playerIds: Array(11).fill(65535), managerId: null });
    expect(replayFromCode(code)).toBeNull();
  });

  test('returns null when the XI does not fit the formation it claims', () => {
    const run = fill(0, 'Liverpool', '1980s'); // 4-3-3 shaped
    const code = encodeRun({ formationId: 2, playerIds: orderedXI(run).map((p) => p.id), managerId: null });
    expect(replayFromCode(code)).toBeNull();
  });
});
