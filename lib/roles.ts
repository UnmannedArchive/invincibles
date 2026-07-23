import roles from '../data/roles.json';
import type { Player, Pos } from './types';

export type Role = 'GK' | 'LB' | 'CB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LM' | 'RM' | 'LW' | 'RW' | 'ST';

/** Which broad group each role belongs to — the group is what the sim uses. */
export const ROLE_GROUP: Record<Role, Pos> = {
  GK: 'GK',
  LB: 'DF',
  CB: 'DF',
  RB: 'DF',
  CDM: 'MF',
  CM: 'MF',
  CAM: 'MF',
  LM: 'MF',
  RM: 'MF',
  LW: 'FW',
  RW: 'FW',
  ST: 'FW',
};

/**
 * Where a player actually played, for the card.
 *
 * The dataset only records the broad group, which put "DF" on Thiago Silva and
 * Dani Alves alike. data/roles.json fills that in by name — a curated list,
 * because a player's position is a fact and guessing it would put Maldini at
 * right-back.
 *
 * Anyone not on the list falls back to the most common role for their group:
 * plausible, and never a claim about someone specific that the data can't
 * support. Fill the list in rather than making the fallback cleverer.
 */
const FALLBACK: Record<Pos, Role> = { GK: 'GK', DF: 'CB', MF: 'CM', FW: 'ST' };

/**
 * A few players are listed in two groups across their eras — Kimmich at
 * right-back and in midfield, Ronaldinho as a winger and as a ten — so their
 * entry carries a role per group rather than one role.
 */
type RoleEntry = Role | Partial<Record<Pos, Role>>;
const CURATED = roles as Record<string, RoleEntry>;

function curatedRole(player: Player): Role | null {
  const entry = CURATED[player.name];
  if (!entry) return null;
  const role = typeof entry === 'string' ? entry : entry[player.pos];
  // A role that contradicts the dataset's group would break formations, so the
  // group always wins.
  return role && ROLE_GROUP[role] === player.pos ? role : null;
}

export function roleOf(player: Player): Role {
  return curatedRole(player) ?? FALLBACK[player.pos];
}

export function isCurated(player: Player): boolean {
  return curatedRole(player) !== null;
}

export { CURATED as ROLES };
