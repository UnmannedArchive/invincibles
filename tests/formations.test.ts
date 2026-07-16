import { describe, expect, test } from 'vitest';
import { FORMATIONS, getFormation } from '../lib/formations';

describe('formations', () => {
  test('offers exactly the three presets', () => {
    expect(FORMATIONS.map((f) => f.name)).toEqual(['4-3-3', '4-4-2', '3-5-2']);
  });

  test('every formation has 11 slots including exactly one GK', () => {
    for (const f of FORMATIONS) {
      expect(f.slots).toHaveLength(11);
      expect(f.slots.filter((s) => s.pos === 'GK')).toHaveLength(1);
    }
  });

  test.each([
    ['4-3-3', { DF: 4, MF: 3, FW: 3 }],
    ['4-4-2', { DF: 4, MF: 4, FW: 2 }],
    ['3-5-2', { DF: 3, MF: 5, FW: 2 }],
  ] as const)('%s has the right outfield counts', (name, counts) => {
    const f = FORMATIONS.find((x) => x.name === name)!;
    for (const [pos, n] of Object.entries(counts)) {
      expect(f.slots.filter((s) => s.pos === pos)).toHaveLength(n);
    }
  });

  test('slot pitch coordinates are percentages within bounds', () => {
    for (const f of FORMATIONS) {
      for (const s of f.slots) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(100);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(100);
      }
    }
  });

  test('getFormation resolves by id and throws on unknown id', () => {
    for (const f of FORMATIONS) expect(getFormation(f.id)).toBe(f);
    expect(() => getFormation(99)).toThrow();
  });
});
