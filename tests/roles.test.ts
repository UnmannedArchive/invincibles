import { describe, expect, test } from 'vitest';
import { ROLES, ROLE_GROUP, isCurated, roleOf } from '../lib/roles';
import { PLAYERS } from '../lib/data';

function find(name: string) {
  const player = PLAYERS.find((p) => p.name === name);
  if (!player) throw new Error(`fixture missing from dataset: ${name}`);
  return player;
}

describe('player roles', () => {
  test('gives every player a role', () => {
    for (const player of PLAYERS) {
      expect(ROLE_GROUP[roleOf(player)]).toBeDefined();
    }
  });

  test('a role always belongs to the group the sim uses', () => {
    for (const player of PLAYERS) {
      expect(ROLE_GROUP[roleOf(player)]).toBe(player.pos);
    }
  });

  test('keepers are keepers', () => {
    for (const player of PLAYERS.filter((p) => p.pos === 'GK')) {
      expect(roleOf(player)).toBe('GK');
    }
  });

  // The two the cards were getting wrong.
  test('names the defenders correctly', () => {
    expect(roleOf(find('Thiago Silva'))).toBe('CB');
    expect(roleOf(find('Dani Alves'))).toBe('RB');
    expect(roleOf(find('Roberto Carlos'))).toBe('LB');
    expect(roleOf(find('Paolo Maldini'))).toBe('LB');
  });

  test('names the midfield correctly', () => {
    expect(roleOf(find('Andrea Pirlo'))).toBe('CDM');
    expect(roleOf(find('Xavi'))).toBe('CM');
    expect(roleOf(find('Zinedine Zidane'))).toBe('CAM');
    expect(roleOf(find('Ryan Giggs'))).toBe('LM');
  });

  test('names the front line correctly', () => {
    expect(roleOf(find('Thierry Henry'))).toBe('ST');
    expect(roleOf(find('Lionel Messi'))).toBe('RW');
    expect(roleOf(find('Neymar'))).toBe('LW');
    expect(roleOf(find('Vinicius Junior'))).toBe('LW');
  });

  test('every curated name is actually in the dataset', () => {
    const known = new Set(PLAYERS.map((p) => p.name));
    const stray = Object.keys(ROLES).filter((name) => !known.has(name));
    expect(stray).toEqual([]);
  });

  // A player listed in two groups across eras carries a role for each.
  test('players listed in two groups get a role for each', () => {
    const kimmich = PLAYERS.filter((p) => p.name === 'Joshua Kimmich');
    for (const p of kimmich) {
      expect(roleOf(p)).toBe(p.pos === 'DF' ? 'RB' : 'CDM');
      expect(isCurated(p)).toBe(true);
    }
    const ronaldinho = PLAYERS.filter((p) => p.name === 'Ronaldinho');
    for (const p of ronaldinho) {
      expect(roleOf(p)).toBe(p.pos === 'MF' ? 'CAM' : 'LW');
    }
  });

  test('falls back for anyone not curated, without claiming to know', () => {
    const uncurated = PLAYERS.find((p) => p.pos === 'DF' && !isCurated(p));
    if (uncurated) expect(roleOf(uncurated)).toBe('CB');
  });

  // Coverage is a fact worth watching: the list is meant to grow.
  test('every player rated 85 or better has a curated role', () => {
    const missing = [
      ...new Set(
        PLAYERS.filter((p) => p.rating >= 85 && p.pos !== 'GK' && !isCurated(p)).map(
          (p) => `${p.name} (${p.pos} ${p.rating})`,
        ),
      ),
    ];
    expect(missing).toEqual([]);
  });
});
