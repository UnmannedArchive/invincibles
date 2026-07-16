import { describe, expect, test } from 'vitest';
import { validatePlayers, POOL_MINIMUMS } from '../lib/validate';
import type { Player, Pos } from '../lib/types';

let nextId = 0;
function pool(club: string, decade: string, counts: Partial<Record<Pos, number>> = {}): Player[] {
  const full: Record<Pos, number> = { GK: 2, DF: 4, MF: 5, FW: 4, ...counts };
  const players: Player[] = [];
  for (const pos of ['GK', 'DF', 'MF', 'FW'] as Pos[]) {
    for (let i = 0; i < full[pos]; i++) {
      players.push({ id: nextId++, name: `${club} ${pos} ${i}`, pos, rating: 80, club, decade });
    }
  }
  return players;
}

describe('validatePlayers', () => {
  test('minimums guarantee any formation can be filled from one pool', () => {
    // 3-5-2 needs 5 MF; 4-4-2 needs 4 DF; 4-3-3 needs 3 FW. One GK suffices:
    // if a pool's GK is taken, the GK slot is filled and never opens again.
    expect(POOL_MINIMUMS).toEqual({ GK: 1, DF: 4, MF: 5, FW: 4 });
  });

  test('accepts a complete dataset', () => {
    const players = [...pool('Arsenal', '1990s'), ...pool('AC Milan', '1990s')];
    expect(validatePlayers(players)).toEqual([]);
  });

  test('flags a pool missing goalkeepers', () => {
    const errors = validatePlayers(pool('Arsenal', '1990s', { GK: 0 }));
    expect(errors.some((e) => e.includes('Arsenal') && e.includes('GK'))).toBe(true);
  });

  test('flags a pool short on midfielders', () => {
    const errors = validatePlayers(pool('Arsenal', '1990s', { MF: 4 }));
    expect(errors.some((e) => e.includes('MF'))).toBe(true);
  });

  test('flags duplicate ids', () => {
    const players = pool('Arsenal', '1990s');
    players[1] = { ...players[1], id: players[0].id };
    expect(validatePlayers(players).some((e) => e.includes('duplicate id'))).toBe(true);
  });

  test('flags out-of-range ratings and empty names', () => {
    const players = pool('Arsenal', '1990s');
    players[0] = { ...players[0], rating: 100 };
    players[1] = { ...players[1], name: ' ' };
    const errors = validatePlayers(players);
    expect(errors.some((e) => e.includes('rating'))).toBe(true);
    expect(errors.some((e) => e.includes('name'))).toBe(true);
  });

  test('flags the same name appearing twice in one pool', () => {
    const players = pool('Arsenal', '1990s');
    players[3] = { ...players[3], name: players[2].name };
    expect(validatePlayers(players).some((e) => e.includes('twice'))).toBe(true);
  });
});
