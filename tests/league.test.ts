import { describe, expect, test } from 'vitest';
import {
  parseEntries,
  buildLeaguePath,
  sanitizeHandle,
  standings,
  type LeagueEntry,
} from '../lib/league';
import { newRun, applyPick, setManager } from '../lib/run';
import { getPool } from '../lib/data';
import { getFormation } from '../lib/formations';
import { encodeRun, sharedFromRun } from '../lib/encode';
import { MANAGERS } from '../lib/managers';

function squad(club: string, decade: string, formationId = 0, managerId = MANAGERS[0].id) {
  let run = newRun(formationId);
  const pool = getPool(club, decade);
  for (let slot = 0; slot < 11; slot++) {
    const pos = getFormation(formationId).slots[slot].pos;
    const player = pool.find((p) => p.pos === pos && !run.picks.includes(p.id))!;
    run = applyPick(run, slot, player.id);
  }
  return setManager(run, managerId);
}

const codeFor = (club: string, decade: string, managerId = MANAGERS[0].id) =>
  encodeRun(sharedFromRun(squad(club, decade, 0, managerId)));

function entry(handle: string, club: string, decade: string): LeagueEntry {
  return { handle, code: codeFor(club, decade) };
}

describe('parseEntries', () => {
  test('splits a handle from its code on the first tilde', () => {
    expect(parseEntries(['Alice~AbC-d_e'])).toEqual([{ handle: 'Alice', code: 'AbC-d_e' }]);
  });

  test('treats a bare segment as an anonymous entry', () => {
    expect(parseEntries(['AbC-d_e'])).toEqual([{ handle: '', code: 'AbC-d_e' }]);
  });

  test('keeps base64url intact even when the code contains a tilde-free run of - and _', () => {
    expect(parseEntries(['Bo~A-_B-_C'])).toEqual([{ handle: 'Bo', code: 'A-_B-_C' }]);
  });

  test('ignores empty segments', () => {
    expect(parseEntries(['', 'Al~x', ''])).toEqual([{ handle: 'Al', code: 'x' }]);
  });
});

describe('sanitizeHandle', () => {
  test('keeps only letters and digits', () => {
    expect(sanitizeHandle('Jake!! 99')).toBe('Jake99');
  });

  test('caps the length', () => {
    expect(sanitizeHandle('a'.repeat(40)).length).toBeLessThanOrEqual(14);
  });

  test('an all-symbol handle becomes empty', () => {
    expect(sanitizeHandle('!!!')).toBe('');
  });
});

describe('buildLeaguePath', () => {
  test('round-trips through parseEntries', () => {
    const entries: LeagueEntry[] = [
      { handle: 'Alice', code: codeFor('Barcelona', '2010s') },
      { handle: '', code: codeFor('Liverpool', '1980s') },
    ];
    expect(parseEntries(buildLeaguePath(entries))).toEqual(entries);
  });

  test('sanitizes handles into the path', () => {
    const path = buildLeaguePath([{ handle: 'Big Dave!', code: 'abc' }]);
    expect(path).toEqual(['BigDave~abc']);
  });
});

describe('standings', () => {
  test('ranks the entries and numbers them 1..N', () => {
    const league = standings([
      entry('Alice', 'Barcelona', '2010s'),
      entry('Bob', 'Newcastle United', '1990s'),
      entry('Cara', 'Liverpool', '1980s'),
    ]);
    expect(league.size).toBe(3);
    expect(league.standings.map((s) => s.rank)).toEqual([1, 2, 3]);
    for (let i = 1; i < league.standings.length; i++) {
      const above = league.standings[i - 1];
      const below = league.standings[i];
      const ordered =
        above.points > below.points ||
        (above.points === below.points &&
          (above.goalDiff > below.goalDiff ||
            (above.goalDiff === below.goalDiff && above.goalsFor >= below.goalsFor)));
      expect(ordered).toBe(true);
    }
  });

  test('a strong squad finishes above a weak one', () => {
    const league = standings([
      entry('Weak', 'Newcastle United', '1990s'),
      entry('Strong', 'Barcelona', '2010s'),
    ]);
    expect(league.standings[0].handle).toBe('Strong');
  });

  test('carries each team code so the row can link to its season', () => {
    const league = standings([entry('Alice', 'Barcelona', '2010s')]);
    expect(league.standings[0].code).toBe(codeFor('Barcelona', '2010s'));
  });

  test('drops unreadable codes instead of failing the whole league', () => {
    const league = standings([
      entry('Alice', 'Barcelona', '2010s'),
      { handle: 'Ghost', code: 'not-a-real-code' },
    ]);
    expect(league.size).toBe(1);
    expect(league.unreadable).toBe(1);
    expect(league.standings.map((s) => s.handle)).toEqual(['Alice']);
  });

  test('names an anonymous entry after its manager', () => {
    const league = standings([{ handle: '', code: codeFor('Barcelona', '2010s', MANAGERS[1].id) }]);
    // MANAGERS[1] is Pep Guardiola
    expect(league.standings[0].handle).toContain('Guardiola');
  });

  test('finds the best attack and the meanest defense', () => {
    const league = standings([
      entry('Alice', 'Barcelona', '2010s'),
      entry('Bob', 'Newcastle United', '1990s'),
      entry('Cara', 'Liverpool', '1980s'),
    ]);
    const mostFor = [...league.standings].sort((a, b) => b.goalsFor - a.goalsFor)[0];
    const fewestAgainst = [...league.standings].sort((a, b) => a.goalsAgainst - b.goalsAgainst)[0];
    expect(league.bestAttack?.handle).toBe(mostFor.handle);
    expect(league.bestDefense?.handle).toBe(fewestAgainst.handle);
  });

  test('an empty league is empty, not an error', () => {
    const league = standings([]);
    expect(league.size).toBe(0);
    expect(league.standings).toEqual([]);
    expect(league.bestAttack).toBeNull();
  });

  test('is deterministic for the same entries', () => {
    const entries = [entry('Alice', 'Barcelona', '2010s'), entry('Bob', 'Liverpool', '1980s')];
    expect(standings(entries)).toEqual(standings(entries));
  });
});
