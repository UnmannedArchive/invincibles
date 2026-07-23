import { describe, expect, test } from 'vitest';
import { squadOutlook } from '../lib/outlook';
import { newRun, applyPick, setManager } from '../lib/run';
import { getFormation } from '../lib/formations';
import { getPool } from '../lib/data';
import { playRun } from '../lib/replay';
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

const RUN = squad('Barcelona', '2010s');
const RESULT = playRun(RUN);
const OUTLOOK = squadOutlook(RUN, RESULT, 300);

describe('squadOutlook', () => {
  test('is the same every time for the same squad', () => {
    expect(squadOutlook(RUN, RESULT, 300)).toEqual(OUTLOOK);
  });

  test('every sampled season lands in a bucket', () => {
    const counted = OUTLOOK.buckets.reduce((sum, b) => sum + b.count, 0);
    expect(counted).toBe(300);
    expect(OUTLOOK.samples).toBe(300);
  });

  test('marks the one bucket the real season fell into', () => {
    const yours = OUTLOOK.buckets.filter((b) => b.isYou);
    expect(yours).toHaveLength(1);
    expect(RESULT.points).toBeGreaterThanOrEqual(yours[0].from);
    expect(RESULT.points).toBeLessThanOrEqual(yours[0].to);
  });

  test('buckets run low to high without gaps', () => {
    for (let i = 1; i < OUTLOOK.buckets.length; i++) {
      expect(OUTLOOK.buckets[i].from).toBe(OUTLOOK.buckets[i - 1].to + 1);
    }
  });

  test('reports rates as percentages', () => {
    for (const pct of [OUTLOOK.championsPct, OUTLOOK.unbeatenPct, OUTLOOK.perfectPct, OUTLOOK.percentile]) {
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });

  test('a perfect season would sit at the top of the range', () => {
    const perfect = { ...RESULT, points: 114, wins: 38, draws: 0, losses: 0 };
    expect(squadOutlook(RUN, perfect, 300).percentile).toBeGreaterThan(95);
  });

  test('a disaster would sit at the bottom', () => {
    const awful = { ...RESULT, points: 0, wins: 0, draws: 0, losses: 38 };
    expect(squadOutlook(RUN, awful, 300).percentile).toBeLessThan(5);
  });

  test('a stronger squad has a higher median', () => {
    const weak = squad('Newcastle United', '1990s');
    const strong = squad('Barcelona', '2010s');
    const weakOutlook = squadOutlook(weak, playRun(weak), 200);
    const strongOutlook = squadOutlook(strong, playRun(strong), 200);
    expect(strongOutlook.median).toBeGreaterThan(weakOutlook.median);
  });

  test('the median sits inside the sampled range', () => {
    expect(OUTLOOK.median).toBeGreaterThanOrEqual(OUTLOOK.worst);
    expect(OUTLOOK.median).toBeLessThanOrEqual(OUTLOOK.best);
  });

  test('the manager counts — the outlook is for this squad as picked', () => {
    const attacking = setManager(RUN, 2); // Guardiola, +4 attack
    const defensive = setManager(RUN, 13); // Simeone, +4 defense
    expect(squadOutlook(attacking, playRun(attacking), 200).median).not.toBe(
      squadOutlook(defensive, playRun(defensive), 200).median,
    );
  });
});
