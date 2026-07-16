import type { Player, Pos } from './types';

// Enough to fill any formation entirely from one pool, so no spin can dead-end
// even if every spin of a run lands on the same club × decade. One GK suffices:
// a pool's GK can only be unavailable if the GK slot is already filled.
export const POOL_MINIMUMS: Record<Pos, number> = { GK: 1, DF: 4, MF: 5, FW: 4 };

export function validatePlayers(players: Player[]): string[] {
  const errors: string[] = [];

  const ids = new Set<number>();
  for (const p of players) {
    if (ids.has(p.id)) errors.push(`duplicate id ${p.id} (${p.name})`);
    ids.add(p.id);
    if (!Number.isInteger(p.rating) || p.rating < 1 || p.rating > 99) {
      errors.push(`${p.name || p.id}: rating ${p.rating} out of range`);
    }
    if (!p.name?.trim()) errors.push(`id ${p.id}: empty name`);
    if (!/^\d{4}s$/.test(p.decade)) errors.push(`${p.name}: bad decade "${p.decade}"`);
  }

  const pools = new Map<string, Player[]>();
  for (const p of players) {
    const key = `${p.club}|${p.decade}`;
    if (!pools.has(key)) pools.set(key, []);
    pools.get(key)!.push(p);
  }

  for (const [key, pool] of pools) {
    const label = key.replace('|', ' ');
    for (const pos of Object.keys(POOL_MINIMUMS) as Pos[]) {
      const n = pool.filter((p) => p.pos === pos).length;
      if (n < POOL_MINIMUMS[pos]) {
        errors.push(`${label}: needs ≥${POOL_MINIMUMS[pos]} ${pos}, has ${n}`);
      }
    }
    const names = new Set<string>();
    for (const p of pool) {
      if (names.has(p.name)) errors.push(`${label}: "${p.name}" appears twice`);
      names.add(p.name);
    }
  }

  return errors;
}
