import { managerById } from './managers';
import { orderedXI, type RunState } from './run';
import { simulateSeason } from './sim';
import type { SeasonResult } from './types';

export interface OutlookBucket {
  from: number;
  to: number;
  count: number;
  isYou: boolean;
}

export interface Outlook {
  samples: number;
  worst: number;
  best: number;
  median: number;
  /** share of sampled seasons this squad finished below the real one */
  percentile: number;
  championsPct: number;
  unbeatenPct: number;
  perfectPct: number;
  buckets: OutlookBucket[];
}

const BUCKET = 3;

/**
 * What this squad usually does.
 *
 * A team plays one season and only one — that's the point of deriving the seed
 * from the XI. But one season hides how good the team actually was: a brilliant
 * side can draw four and lose the title, and without context the player can't
 * tell whether they were unlucky. So we replay the same XI across a spread of
 * other seeds and show where the real season landed. Nothing here changes the
 * result; it just tells you what it was worth.
 */
export function squadOutlook(
  run: RunState,
  actual: SeasonResult,
  samples = 1000,
): Outlook {
  const xi = orderedXI(run);
  const manager = run.managerId === null ? null : (managerById(run.managerId) ?? null);

  const points: number[] = [];
  let champions = 0;
  let unbeaten = 0;
  let perfect = 0;

  for (let seed = 0; seed < samples; seed++) {
    const season = simulateSeason(xi, run.formationId, seed, manager);
    points.push(season.points);
    if (season.position === 1) champions++;
    if (season.losses === 0) unbeaten++;
    if (season.tier === 'perfect') perfect++;
  }

  const sorted = [...points].sort((a, b) => a - b);
  const worst = sorted[0];
  const best = sorted[sorted.length - 1];
  const median = sorted[Math.floor(sorted.length / 2)];
  const beaten = points.filter((p) => p < actual.points).length;

  // Buckets span the sampled range and the real season, so "you" is always on
  // the chart even when the season was a freak.
  const low = Math.min(worst, actual.points);
  const high = Math.max(best, actual.points);
  const start = Math.floor(low / BUCKET) * BUCKET;
  const buckets: OutlookBucket[] = [];
  for (let from = start; from <= high; from += BUCKET) {
    const to = from + BUCKET - 1;
    buckets.push({
      from,
      to,
      count: points.filter((p) => p >= from && p <= to).length,
      isYou: actual.points >= from && actual.points <= to,
    });
  }

  const pct = (n: number) => Math.round((n / samples) * 1000) / 10;
  return {
    samples,
    worst,
    best,
    median,
    percentile: pct(beaten),
    championsPct: pct(champions),
    unbeatenPct: pct(unbeaten),
    perfectPct: pct(perfect),
    buckets,
  };
}
