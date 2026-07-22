import type { Player } from './types';
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

/**
 * The slot the draft is filling right now. Slots run in team-sheet order, so a
 * draft goes keeper, back line, midfield, front line — you're picking *for a
 * position*, the way a FUT draft does, not picking whoever is best available.
 */
export function nextOpenSlot(run: RunState): number {
  return run.picks.findIndex((p) => p === null);
}

/** Players in this pool who can fill that slot and aren't already picked. */
export function eligibleForSlot(run: RunState, pool: Player[], slotIndex: number): Player[] {
  const slot = getFormation(run.formationId).slots[slotIndex];
  if (!slot) return [];
  const taken = pickedIds(run);
  return pool.filter((p) => p.pos === slot.pos && !taken.has(p.id));
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
