import { describe, expect, test } from 'vitest';
import {
  newRun,
  setManager,
  eligibleInPool,
  firstOpenSlotFor,
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
    const player = eligibleInPool(run, POOL())[0];
    run = applyPick(run, firstOpenSlotFor(run, player.pos), player.id);
  }
  return managerId === null ? run : setManager(run, managerId);
}

describe('drafting from a spin', () => {
  test('offers anyone in the pool you still have a slot for', () => {
    const run = newRun(0);
    const open = new Set(getFormation(0).slots.map((s) => s.pos));
    for (const player of eligibleInPool(run, POOL())) {
      expect(open.has(player.pos)).toBe(true);
    }
  });

  test('stops offering a position once its slots are full', () => {
    let run = newRun(0);
    const keeper = POOL().find((p) => p.pos === 'GK')!;
    run = applyPick(run, firstOpenSlotFor(run, 'GK'), keeper.id);
    // 4-3-3 has one keeper, so no goalkeeper should be on offer any more
    expect(eligibleInPool(run, POOL()).some((p) => p.pos === 'GK')).toBe(false);
  });

  test('never offers a player already on the team sheet', () => {
    let run = newRun(0);
    const first = eligibleInPool(run, POOL())[0];
    run = applyPick(run, firstOpenSlotFor(run, first.pos), first.id);
    expect(eligibleInPool(run, POOL()).map((p) => p.id)).not.toContain(first.id);
  });

  test('a pick lands in the first slot still open for their position', () => {
    const run = newRun(0);
    // 4-3-3 back four: LB, CB, CB, RB — a defender fills the left-back slot first
    expect(firstOpenSlotFor(run, 'DF')).toBe(1);
    expect(getFormation(0).slots[1].label).toBe('LB');
  });

  test('reports no open slot once a position is full', () => {
    expect(firstOpenSlotFor(draft(0), 'FW')).toBe(-1);
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
    expect(decodeRun(encodeRun(sharedFromRun(run))).managerId).toBe(MANAGERS[3].id);
  });

  test('a run with no manager still encodes', () => {
    expect(decodeRun(encodeRun(sharedFromRun(draft(0, null)))).managerId).toBeNull();
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
    const shared = sharedFromRun(draft(0, null));
    expect(replayFromCode(encodeRun({ ...shared, managerId: 9999 }))).toBeNull();
  });

  test('codes from the previous version are rejected', () => {
    expect(() => decodeRun('A'.repeat(32))).toThrow();
  });
});
