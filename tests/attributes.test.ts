import { describe, expect, test } from 'vitest';
import { attributesFor, GK_KEYS, OUTFIELD_KEYS } from '../lib/attributes';
import { PLAYERS } from '../lib/data';
import type { Player } from '../lib/types';

function player(over: Partial<Player>): Player {
  return { id: 1, name: 'Test Player', pos: 'FW', rating: 85, club: 'Test FC', decade: '1990s', ...over };
}

describe('attributesFor', () => {
  test('gives outfielders the six FUT face stats', () => {
    expect(attributesFor(player({ pos: 'MF' })).map((a) => a.key)).toEqual(OUTFIELD_KEYS);
  });

  test('gives keepers keeper stats instead', () => {
    expect(attributesFor(player({ pos: 'GK' })).map((a) => a.key)).toEqual(GK_KEYS);
  });

  test('is stable for a given player', () => {
    const p = player({ id: 4242 });
    expect(attributesFor(p)).toEqual(attributesFor(p));
  });

  test('varies between players of the same rating', () => {
    const a = attributesFor(player({ id: 1, rating: 84 }));
    const b = attributesFor(player({ id: 2, rating: 84 }));
    expect(a).not.toEqual(b);
  });

  test('keeps every value on the card in 1-99', () => {
    for (const p of PLAYERS) {
      for (const attr of attributesFor(p)) {
        expect(attr.value).toBeGreaterThanOrEqual(1);
        expect(attr.value).toBeLessThanOrEqual(99);
      }
    }
  });

  // A striker who can't finish would read as a bug on the card.
  test('leads with the stats the position is known for', () => {
    const fw = Object.fromEntries(attributesFor(player({ pos: 'FW', rating: 88 })).map((a) => [a.key, a.value]));
    expect(fw.SHO).toBeGreaterThan(fw.DEF);
    const df = Object.fromEntries(attributesFor(player({ pos: 'DF', rating: 88 })).map((a) => [a.key, a.value]));
    expect(df.DEF).toBeGreaterThan(df.SHO);
  });

  test('tracks the overall rating', () => {
    const low = attributesFor(player({ pos: 'MF', rating: 72 }));
    const high = attributesFor(player({ pos: 'MF', rating: 94 }));
    const avg = (list: { value: number }[]) => list.reduce((s, a) => s + a.value, 0) / list.length;
    expect(avg(high)).toBeGreaterThan(avg(low) + 15);
  });
});
