import { describe, expect, test } from 'vitest';
import {
  newRun,
  setManager,
  nextOpenSlot,
  eligibleForSlot,
  isComplete,
  isReady,
  applyPick,
} from '../lib/run';
import { getPool } from '../lib/data';
import { getFormation } from '../lib/formations';
import { encodeRun, decodeRun, sharedFromRun } from '../lib/encode';
import { seasonSeed } from '../lib/seed';
import { playRun, replayFromCode } from '../lib/replay';
import { MANAGERS } from '../lib/managers';

const POOL = () => getPool('Barcelona', '2010s');

function draft(formationId: number, managerId: number | null = MANAGERS[0].id) {
  let run = newRun(formationId);
  while (!isComplete(run)) {
    const slot = nextOpenSlot(run);
    const player = eligibleForSlot(run, POOL(), slot)[0];
    run = applyPick(run, slot, player.id);
  }
  return managerId === null ? run : setManager(run, managerId);
}

describe('a FUT-style draft', () => {
  test('fills the team sheet in order: keeper first, then out from the back', () => {
    let run = newRun(0);
    const order: string[] = [];
    while (!isComplete(run)) {
      const slot = nextOpenSlot(run);
      order.push(getFormation(0).slots[slot].label);
      run = applyPick(run, slot, eligibleForSlot(run, POOL(), slot)[0].id);
    }
    expect(order).toEqual(['GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW']);
  });

  test('offers only players who can play the slot being filled', () => {
    const run = newRun(0);
    const slot = nextOpenSlot(run); // GK
    for (const player of eligibleForSlot(run, POOL(), slot)) {
      expect(player.pos).toBe('GK');
    }
  });

  test('never offers a player already on the team sheet', () => {
    let run = newRun(0);
    const first = eligibleForSlot(run, POOL(), 0)[0];
    run = applyPick(run, 0, first.id);
    for (let slot = 1; slot < 11; slot++) {
      expect(eligibleForSlot(run, POOL(), slot).map((p) => p.id)).not.toContain(first.id);
    }
  });

  test('reports no open slot once the XI is full', () => {
    expect(nextOpenSlot(draft(0))).toBe(-1);
  });

  test('is only ready to play once a manager is appointed', () => {
    const withoutManager = draft(0, null);
    expect(isComplete(withoutManager)).toBe(true);
    expect(isReady(withoutManager)).toBe(false);
    expect(isReady(setManager(withoutManager, MANAGERS[0].id))).toBe(true);
  });

  test('a new run starts with no manager', () => {
    expect(newRun(0).managerId).toBeNull();
  });
});

describe('the manager travels with the run', () => {
  test('the share code carries it', () => {
    const run = draft(0, MANAGERS[3].id);
    const decoded = decodeRun(encodeRun(sharedFromRun(run)));
    expect(decoded.managerId).toBe(MANAGERS[3].id);
  });

  test('a run with no manager still encodes', () => {
    const decoded = decodeRun(encodeRun(sharedFromRun(draft(0, null))));
    expect(decoded.managerId).toBeNull();
  });

  test('swapping the manager changes the season', () => {
    const a = draft(0, MANAGERS[1].id);
    const b = setManager(a, MANAGERS[12].id);
    expect(seasonSeed(0, a.picks as number[], a.managerId)).not.toBe(
      seasonSeed(0, b.picks as number[], b.managerId),
    );
    expect(playRun(a)).not.toEqual(playRun(b));
  });

  test('a shared code replays to the same season, manager included', () => {
    const run = draft(1, MANAGERS[5].id);
    const replay = replayFromCode(encodeRun(sharedFromRun(run)))!;
    expect(replay.manager?.id).toBe(MANAGERS[5].id);
    expect(replay.result).toEqual(playRun(run));
  });

  test('rejects a code naming a manager who does not exist', () => {
    const run = draft(0, null);
    const shared = sharedFromRun(run);
    const code = encodeRun({ ...shared, managerId: 9999 });
    expect(replayFromCode(code)).toBeNull();
  });

  test('codes from the previous version are rejected', () => {
    expect(() => decodeRun('A'.repeat(32))).toThrow();
  });
});
