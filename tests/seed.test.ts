import { describe, expect, test } from 'vitest';
import { seasonSeed } from '../lib/seed';

const XI = [12, 340, 78, 900, 4501, 233, 1180, 66, 3009, 2222, 51];

describe('seasonSeed', () => {
  test('is deterministic for the same XI', () => {
    expect(seasonSeed(0, XI)).toBe(seasonSeed(0, XI));
  });

  test('returns an unsigned 32-bit integer', () => {
    const seed = seasonSeed(1, XI);
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
    expect(seed).toBeLessThanOrEqual(0xffffffff);
  });

  // Slot order within a position group is cosmetic, so shuffling it must not
  // hand the player a fresh season to fish in.
  test('ignores the order players were slotted in', () => {
    const shuffled = [...XI].reverse();
    expect(seasonSeed(0, shuffled)).toBe(seasonSeed(0, XI));
  });

  test('changes when a single player changes', () => {
    const swapped = [...XI];
    swapped[5] = swapped[5] + 1;
    expect(seasonSeed(0, swapped)).not.toBe(seasonSeed(0, XI));
  });

  test('changes when the formation changes', () => {
    expect(seasonSeed(0, XI)).not.toBe(seasonSeed(1, XI));
    expect(seasonSeed(1, XI)).not.toBe(seasonSeed(2, XI));
  });

  test('spreads different XIs across the seed space', () => {
    const seeds = new Set<number>();
    for (let i = 0; i < 500; i++) {
      seeds.add(seasonSeed(0, XI.map((id, k) => (k === 0 ? id + i : id))));
    }
    expect(seeds.size).toBe(500);
  });
});
