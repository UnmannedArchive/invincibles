import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PLAYERS, POOL_KEYS, getPool } from '../lib/data';

const DIR = path.join(process.cwd(), 'data', 'players');

function filesOnDisk() {
  return fs.readdirSync(DIR).filter((f) => f.endsWith('.json'));
}

function playersOnDisk(): { club: string; decade: string }[] {
  return filesOnDisk().flatMap((f) =>
    JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')),
  );
}

describe('the loaded dataset', () => {
  // A file can be committed but left out of the manifest in lib/data.ts, which
  // silently drops whole clubs from the game. This is that regression guard.
  test('loads every player file that exists on disk', () => {
    expect(PLAYERS.length).toBe(playersOnDisk().length);
  });

  test('loads every club that exists on disk', () => {
    const loaded = new Set(PLAYERS.map((p) => p.club));
    const missing = [...new Set(playersOnDisk().map((p) => p.club))].filter(
      (c) => !loaded.has(c),
    );
    expect(missing).toEqual([]);
  });

  test('covers all five leagues', () => {
    const clubs = [...new Set(PLAYERS.map((p) => p.club))];
    for (const club of [
      'Manchester United',
      'Real Madrid',
      'Juventus',
      'Bayern Munich',
      'Paris Saint-Germain',
    ]) {
      expect(clubs).toContain(club);
    }
  });

  test('gives every player a unique id that fits a share code', () => {
    const ids = PLAYERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.max(...ids)).toBeLessThanOrEqual(0xffff);
    expect(Math.min(...ids)).toBeGreaterThanOrEqual(0);
  });

  test('exposes every pool through POOL_KEYS', () => {
    expect(POOL_KEYS.length).toBeGreaterThan(0);
    for (const key of POOL_KEYS) {
      expect(getPool(key.club, key.decade).length).toBeGreaterThan(0);
    }
  });
});
