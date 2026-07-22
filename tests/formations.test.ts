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

// Which broad group each specific position belongs to. The sim only knows the
// group; the label is what the player sees on the pitch.
const GROUP: Record<string, string> = {
  GK: 'GK',
  LB: 'DF', RB: 'DF', CB: 'DF', LWB: 'DF', RWB: 'DF',
  CDM: 'MF', CM: 'MF', CAM: 'MF', LM: 'MF', RM: 'MF',
  LW: 'FW', RW: 'FW', ST: 'FW',
};

describe('slot positions', () => {
  test('every slot carries a real position label', () => {
    for (const f of FORMATIONS) {
      for (const slot of f.slots) {
        expect(GROUP[slot.label], `${f.name}: unknown label ${slot.label}`).toBeDefined();
      }
    }
  });

  test('each label belongs to the group the sim will use', () => {
    for (const f of FORMATIONS) {
      for (const slot of f.slots) expect(GROUP[slot.label]).toBe(slot.pos);
    }
  });

  test('a 4-3-3 reads as a real 4-3-3', () => {
    expect(getFormation(0).slots.map((s) => s.label)).toEqual([
      'GK', 'LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW',
    ]);
  });

  test('a 4-4-2 has wide midfielders and two strikers', () => {
    const labels = getFormation(1).slots.map((s) => s.label);
    expect(labels.filter((l) => l === 'ST')).toHaveLength(2);
    expect(labels).toContain('LM');
    expect(labels).toContain('RM');
  });

  test('a 3-5-2 has three centre-backs and five in midfield', () => {
    const labels = getFormation(2).slots.map((s) => s.label);
    expect(labels.filter((l) => l === 'CB')).toHaveLength(3);
    expect(labels.filter((l) => GROUP[l] === 'MF')).toHaveLength(5);
  });

  test('labels run left to right across the pitch', () => {
    const back = getFormation(0).slots.filter((s) => s.pos === 'DF');
    expect(back[0].label).toBe('LB');
    expect(back[back.length - 1].label).toBe('RB');
    expect(back[0].y).toBeLessThan(back[back.length - 1].y);
  });
});
