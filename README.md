# Invincibles

A soccer take on [82-0](https://82-0.com). Spin the eras, draft an XI out of football history one player at a time, then play a 38-game season and find out whether it holds up unbeaten.

The loop is deliberately the same as the original: pick a formation, spin, get a club × decade, take exactly one player from that pool into an open slot, repeat eleven times. No re-spins, no takebacks. Picked players disappear from later pools, so a spin that lands on the same club twice is not a free pass.

Three tiers to chase:

- **Champions** — finish top of the table
- **Invincible** — champions, and no losses
- **Perfect** — win all 38

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest: sim, codec, dataset, run-state
npm run validate-data
npm run tune       # Monte Carlo distribution report
```

## How the season is simulated

`simulateSeason(xi, formationId, seed)` is pure and deterministic — same inputs, same season, every time. That is what makes a shared run a real replay rather than a screenshot.

Your XI collapses to two numbers. Attack weights the front of the team (`0.50·avg(FW) + 0.35·avg(MF) + 0.15·avg(DF)`), defense weights the back (`0.35·GK + 0.45·avg(DF) + 0.20·avg(MF)`). Because those are averages *within* position groups, formation actually matters: 3-5-2 gives you fewer defensive slots to dilute, 4-3-3 gives you more attacking ones to stack.

You face 19 opponents twice each. Per match, expected goals for and against come from the attack-vs-defense differential, and actual goals are drawn from a Poisson distribution off a seeded mulberry32. Draws fall out of that naturally, which is the whole point — an unbeaten season has to survive 38 chances to slip up, not just 38 rating comparisons.

The constants came out of `scripts/tune.ts`, a 10k-season Monte Carlo over flat-rated archetype XIs. Where it landed:

| draft | avg pts | champions | unbeaten | perfect |
|---|---|---|---|---|
| casual (82) | 78.2 | 1.1% | 0.02% | 0% |
| median (87) | 93.8 | 44.2% | 2.6% | 0% |
| strong (92) | 104.3 | 94.6% | 26.1% | 0.8% |
| god (97) | 110.1 | 99.8% | 63.1% | 15.8% |

I originally wanted the median draft to go unbeaten around 10% of the time. A 36-config grid search said that was never happening — median unbeaten tops out near 4% at any sane setting, because 38 games of real draw-and-upset math punish you eventually. I kept the math and dropped the target instead. Invincible is the name of the game; it should cost something.

## Sharing

A finished run compresses to a base64url code — version byte, formation id, 11 player ids, and the season seed. `/r/[code]` decodes it, re-runs the sim, and renders the same result; `/api/og` draws the share card via `next/og` so links unfurl properly. A bad or truncated code degrades to a fallback page and a fallback image rather than a 500.

There is no database and no accounts. The URL *is* the save file.

## Data

~1,700 players across 28 clubs and 116 club × decade pools, in `data/players/`. `scripts/validate-data.ts` enforces that every pool carries enough of each position that no spin can ever dead-end you — that invariant is also a vitest test, since a draft that can't be finished is the one bug that ruins a run outright.

Text names only. No crests, no photos, no likenesses. Ratings are mine and are meant to be argued with.

## Stack

Next.js App Router, TypeScript, Tailwind, deployed on Vercel. The sim is written as a pluggable competition config so a Champions League group-and-knockout stage and a World Cup bracket can drop in later without touching the league path.
