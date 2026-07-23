import type { Player, Pos } from './types';
import { getFormation } from './formations';
import { POOL_KEYS, playerById, type PoolKey } from './data';
import type { Rng } from './rng';

export interface RunState {
  formationId: number;
  /** picks[slotIndex] = player id, or null if that slot is still open */
  picks: (number | null)[];
  /** the dugout — appointed after the XI, or null while drafting */
  managerId: number | null;
}

export function newRun(formationId: number): RunState {
  const formation = getFormation(formationId);
  return { formationId, picks: formation.slots.map(() => null), managerId: null };
}

export function setManager(run: RunState, managerId: number): RunState {
  return { ...run, managerId };
}

/** Positions that still have at least one open slot. */
function openPositions(run: RunState): Set<Pos> {
  const formation = getFormation(run.formationId);
  const open = new Set<Pos>();
  run.picks.forEach((p, i) => {
    if (p === null) open.add(formation.slots[i].pos);
  });
  return open;
}

/**
 * Everyone in this pool you could still take: any position you have an open
 * slot for, minus anyone already on the team sheet. The spin decides the club
 * and the era; what you do with it is yours.
 */
export function eligibleInPool(run: RunState, pool: Player[]): Player[] {
  const positions = openPositions(run);
  const taken = pickedIds(run);
  return pool.filter((p) => positions.has(p.pos) && !taken.has(p.id));
}

/** Where a player of this position goes: the first slot still open for them. */
export function firstOpenSlotFor(run: RunState, pos: Pos): number {
  const formation = getFormation(run.formationId);
  return formation.slots.findIndex((s, i) => s.pos === pos && run.picks[i] === null);
}

function pickedIds(run: RunState): Set<number> {
  return new Set(run.picks.filter((p): p is number => p !== null));
}

export function applyPick(run: RunState, slotIndex: number, playerId: number): RunState {
  const formation = getFormation(run.formationId);
  const slot = formation.slots[slotIndex];
  if (!slot) throw new Error(`No slot ${slotIndex} in ${formation.name}`);
  if (run.picks[slotIndex] !== null) throw new Error(`Slot ${slotIndex} already filled`);
  const player = playerById(playerId);
  if (!player) throw new Error(`Unknown player ${playerId}`);
  if (player.pos !== slot.pos) {
    throw new Error(`${player.name} (${player.pos}) cannot fill a ${slot.pos} slot`);
  }
  if (pickedIds(run).has(playerId)) throw new Error(`${player.name} already picked`);
  const picks = run.picks.slice();
  picks[slotIndex] = playerId;
  return { ...run, picks };
}

/** Eleven players picked. */
export function isComplete(run: RunState): boolean {
  return run.picks.every((p) => p !== null);
}

/** Eleven players and a manager: the squad can play. */
export function isReady(run: RunState): boolean {
  return isComplete(run) && run.managerId !== null;
}

export function orderedXI(run: RunState): Player[] {
  return run.picks.map((id) => {
    if (id === null) throw new Error('Run is not complete');
    return playerById(id)!;
  });
}

export function spinPool(rng: Rng): PoolKey {
  return POOL_KEYS[Math.floor(rng() * POOL_KEYS.length)];
}
