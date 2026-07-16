import { describe, expect, test } from 'vitest';
import { mulberry32, poisson } from '../lib/rng';

describe('mulberry32', () => {
  test('same seed produces the same sequence', () => {
    const a = mulberry32(1234);
    const b = mulberry32(1234);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  test('different seeds produce different sequences', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 20 }, () => a());
    const seqB = Array.from({ length: 20 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  test('values are in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('poisson', () => {
  test('is deterministic for a seeded rng', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const drawsA = Array.from({ length: 50 }, () => poisson(a, 1.5));
    const drawsB = Array.from({ length: 50 }, () => poisson(b, 1.5));
    expect(drawsA).toEqual(drawsB);
  });

  test('lambda 0 always yields 0 goals', () => {
    const rng = mulberry32(9);
    for (let i = 0; i < 100; i++) expect(poisson(rng, 0)).toBe(0);
  });

  test('sample mean approximates lambda', () => {
    const rng = mulberry32(1000);
    const n = 20000;
    let sum = 0;
    for (let i = 0; i < n; i++) sum += poisson(rng, 2.2);
    expect(sum / n).toBeGreaterThan(2.1);
    expect(sum / n).toBeLessThan(2.3);
  });

  test('only returns non-negative integers', () => {
    const rng = mulberry32(5);
    for (let i = 0; i < 500; i++) {
      const v = poisson(rng, 1.3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });
});
