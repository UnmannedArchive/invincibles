// Monte Carlo report of season outcomes for archetype drafts.
// Targets (from the design spec): a median draft wins the league ~40-55% and goes
// unbeaten ~5-15%, perfect < 0.5%; a god-tier draft goes perfect ~10-15%.
import { simulateSeason } from '../lib/sim';
import { getFormation } from '../lib/formations';
import type { Player } from '../lib/types';

const RUNS = 10_000;

function xiOf(rating: number): Player[] {
  return getFormation(0).slots.map((slot, i) => ({
    id: i,
    name: `P${i}`,
    pos: slot.pos,
    rating,
    club: 'X',
    decade: 'x',
  }));
}

const archetypes = [
  ['casual (82)', 82],
  ['median (87)', 87],
  ['strong (92)', 92],
  ['god (97)', 97],
] as const;

for (const [label, rating] of archetypes) {
  const xi = xiOf(rating);
  let champions = 0;
  let invincible = 0;
  let perfect = 0;
  let points = 0;
  for (let seed = 0; seed < RUNS; seed++) {
    const r = simulateSeason(xi, 0, seed);
    points += r.points;
    if (r.tier !== 'none') champions++;
    if (r.tier === 'invincible' || r.tier === 'perfect') invincible++;
    if (r.tier === 'perfect') perfect++;
  }
  const pct = (n: number) => ((100 * n) / RUNS).toFixed(2).padStart(6) + '%';
  console.log(
    `${label.padEnd(12)} avg pts ${(points / RUNS).toFixed(1).padStart(5)}` +
      ` | champions ${pct(champions)} | unbeaten ${pct(invincible)} | perfect ${pct(perfect)}`,
  );
}
