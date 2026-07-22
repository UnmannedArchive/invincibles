import type { Player, Pos } from './types';

export const OUTFIELD_KEYS = ['PAC', 'SHO', 'PAS', 'DRI', 'DEF', 'PHY'] as const;
export const GK_KEYS = ['DIV', 'HAN', 'KIC', 'REF', 'SPD', 'POS'] as const;

export interface Attribute {
  key: string;
  value: number;
}

/**
 * The six face stats a card carries. The dataset only rates a player overall,
 * so these are spread from that overall by position and jittered per player —
 * flavour, deliberately, not a claim about anyone's real pace. Deterministic
 * from the id so a card looks the same everywhere it appears.
 */
const PROFILE: Record<Pos, number[]> = {
  //        PAC  SHO  PAS  DRI  DEF  PHY
  FW: [3, 5, -6, 3, -30, -4],
  MF: [-3, -6, 4, 3, -6, -3],
  DF: [-2, -22, -8, -10, 4, 3],
  //       DIV  HAN  KIC  REF  SPD  POS
  GK: [1, 0, -6, 2, -12, 1],
};

function jitter(id: number, slot: number): number {
  // small deterministic hash so two 84s don't wear identical cards
  let h = Math.imul(id + 1, 0x9e3779b1) ^ Math.imul(slot + 1, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return ((h >>> 0) % 9) - 4;
}

export function attributesFor(player: Player): Attribute[] {
  const keys = player.pos === 'GK' ? GK_KEYS : OUTFIELD_KEYS;
  return keys.map((key, i) => {
    const raw = player.rating + PROFILE[player.pos][i] + jitter(player.id, i);
    return { key, value: Math.max(1, Math.min(99, Math.round(raw))) };
  });
}
