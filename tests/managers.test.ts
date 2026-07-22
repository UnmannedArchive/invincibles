import { describe, expect, test } from 'vitest';
import { MANAGERS, managerById, managerShortlist } from '../lib/managers';
import { mulberry32 } from '../lib/rng';

describe('the manager pool', () => {
  test('has a deep enough bench to keep a shortlist interesting', () => {
    expect(MANAGERS.length).toBeGreaterThanOrEqual(24);
  });

  test('gives every manager a unique id that fits the share code', () => {
    const ids = MANAGERS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.max(...ids)).toBeLessThanOrEqual(0xffff);
    expect(Math.min(...ids)).toBeGreaterThan(0); // 0 means "no manager"
  });

  test('keeps bonuses small enough not to out-weigh the XI', () => {
    for (const m of MANAGERS) {
      expect(m.attack).toBeGreaterThanOrEqual(0);
      expect(m.defense).toBeGreaterThanOrEqual(0);
      expect(m.attack + m.defense).toBeLessThanOrEqual(5);
    }
  });

  test('matches each touchline style to where the bonus went', () => {
    for (const m of MANAGERS) {
      if (m.style === 'attacking') expect(m.attack).toBeGreaterThan(m.defense);
      if (m.style === 'defensive') expect(m.defense).toBeGreaterThan(m.attack);
      if (m.style === 'balanced') expect(Math.abs(m.attack - m.defense)).toBeLessThanOrEqual(1);
    }
  });

  test('offers every style, so the last pick is a real choice', () => {
    const styles = new Set(MANAGERS.map((m) => m.style));
    expect([...styles].sort()).toEqual(['attacking', 'balanced', 'defensive']);
  });

  test('resolves by id', () => {
    expect(managerById(MANAGERS[0].id)).toBe(MANAGERS[0]);
    expect(managerById(9999)).toBeUndefined();
  });
});

describe('managerShortlist', () => {
  test('offers the asked-for number of distinct managers', () => {
    const list = managerShortlist(mulberry32(7), 4);
    expect(list).toHaveLength(4);
    expect(new Set(list.map((m) => m.id)).size).toBe(4);
  });

  test('is stable for a given seed and varies across seeds', () => {
    const a = managerShortlist(mulberry32(1), 4).map((m) => m.id);
    const b = managerShortlist(mulberry32(1), 4).map((m) => m.id);
    const c = managerShortlist(mulberry32(2), 4).map((m) => m.id);
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });

  test('never asks for more managers than exist', () => {
    expect(managerShortlist(mulberry32(3), 999).length).toBe(MANAGERS.length);
  });
});
