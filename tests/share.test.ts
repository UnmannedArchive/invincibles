import { describe, expect, test } from 'vitest';
import { shareText, SQUARES } from '../lib/share';
import { newRun, applyPick, setManager, nextOpenSlot, eligibleForSlot, isComplete } from '../lib/run';
import { getPool } from '../lib/data';
import { playRun } from '../lib/replay';
import { MANAGERS } from '../lib/managers';

function squad(formationId = 0, managerId: number | null = MANAGERS[0].id) {
  let run = newRun(formationId);
  while (!isComplete(run)) {
    const slot = nextOpenSlot(run);
    run = applyPick(run, slot, eligibleForSlot(run, getPool('Barcelona', '2010s'), slot)[0].id);
  }
  return managerId === null ? run : setManager(run, managerId);
}

const URL = 'https://invincibles.example/r/ABC';
const SQ: string[] = Object.values(SQUARES);

describe('shareText', () => {
  const run = squad();
  const result = playRun(run);
  const text = shareText(run, result, URL);

  test('leads with the game and the shape', () => {
    expect(text.split('\n')[0]).toContain('INVINCIBLES');
    expect(text.split('\n')[0]).toContain('4-3-3');
  });

  test('states the record and the points', () => {
    expect(text).toContain(`${result.wins}W`);
    expect(text).toContain(`${result.draws}D`);
    expect(text).toContain(`${result.losses}L`);
    expect(text).toContain(`${result.points} pts`);
  });

  test('names the manager', () => {
    expect(text).toContain(MANAGERS[0].name);
  });

  test('draws one square per match', () => {
    const squares = [...text].filter((ch) => SQ.includes(ch));
    expect(squares).toHaveLength(38);
  });

  test('squares match the season, in order', () => {
    const expected = result.matches
      .map((m) =>
        m.goalsFor > m.goalsAgainst
          ? SQUARES.win
          : m.goalsFor < m.goalsAgainst
            ? SQUARES.draw && m.goalsFor === m.goalsAgainst
              ? SQUARES.draw
              : SQUARES.loss
            : SQUARES.draw,
      )
      .join('');
    const drawn = [...text].filter((ch) => SQ.includes(ch)).join('');
    expect(drawn).toBe(expected);
  });

  test('breaks the squares into readable rows', () => {
    const rows = text.split('\n').filter((line) => [...line].some((ch) => SQ.includes(ch)));
    expect(rows.length).toBeGreaterThan(1);
    for (const row of rows) expect([...row].length).toBeLessThanOrEqual(10);
  });

  test('ends with the link, so it travels', () => {
    expect(text.trimEnd().endsWith(URL)).toBe(true);
  });

  test('a run without a manager still shares', () => {
    const bare = squad(1, null);
    const out = shareText(bare, playRun(bare), URL);
    expect(out).toContain('4-4-2');
    expect(out).toContain(URL);
  });

  test('calls a perfect season what it is', () => {
    const perfect = { ...playRun(run), wins: 38, draws: 0, losses: 0, points: 114, tier: 'perfect' as const };
    expect(shareText(run, perfect, URL)).toContain('PERFECT');
  });
});
