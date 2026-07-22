# Invincibles

A soccer take on [82-0](https://82-0.com). Spin the eras, draft an XI out of football history one player at a time, then play a 38-game season and find out whether it holds up unbeaten.

The loop is 82-0's spin crossed with a FUT online draft. Pick a formation, then fill the team sheet in order — keeper, back line, midfield, front line. Each spin lands on a club × decade and offers you only the players who can play the position you're on, so you're picking *a left-back from Milan in the 80s*, not whoever happens to be best. Eleven picks, no re-spins, no takebacks, and picked players disappear from later pools.

Then you appoint a manager. Thirty of them across the eras, each with a touchline style worth a few rating points at one end of the pitch or the other, and the season kicks off the moment you choose.

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

## The look

Shaped after the FUT-era FIFA menus (20–23): near-black navy, glassy panels, one electric cyan→violet→magenta gradient, and notched corners throughout. Green is spent only on the pitch.

The signature element is the player card. Every player renders as a Team-of-the-Year-style card — tapered shield, metallic frame, rating and position stacked top-left, name band, six face stats. Tier comes from the rating and is cut to this dataset rather than to FUT's thresholds: ratings here run 70–98 with a median of 81, so 90+ is TOTY (about 5% of the pool), 85+ gold, 80+ silver, and the rest bronze. Pulling a 90 out of a spin should feel like pulling a TOTY.

The six face stats don't exist in the data — the dataset rates a player overall and nothing else. They're spread from that overall by position and jittered deterministically off the player id, so a card looks identical everywhere it appears but isn't claiming to know anyone's real pace. Keepers get keeper stats (DIV/HAN/KIC/REF/SPD/POS).

**No crests, no logos, no photos.** Club badges and league marks are trademarked artwork and this project has no licence for them. What the cards carry instead is drawn from facts about a club: its kit colours and the pattern it actually plays in — Juventus stripes, PSG's sash, Newcastle's black and white — generated into original badge art with the club's monogram, plus the national flag of its league, since flags of nations aren't anyone's copyright. Names are text. `lib/clubs.ts` is where all of that lives.

## How the season is simulated

`simulateSeason(xi, formationId, seed)` is pure and deterministic — same inputs, same season, every time. That is what makes a shared run a real replay rather than a screenshot.

Your XI collapses to two numbers. Attack weights the front of the team (`0.50·avg(FW) + 0.35·avg(MF) + 0.15·avg(DF)`), defense weights the back (`0.35·GK + 0.45·avg(DF) + 0.20·avg(MF)`). Because those are averages *within* position groups, formation actually matters: 3-5-2 gives you fewer defensive slots to dilute, 4-3-3 gives you more attacking ones to stack.

You face 19 invented clubs twice each — the draft pools are real footballers, but the league you drop them into belongs to nobody. Fixtures are shuffled off the seed, so seasons don't all end against the same two title rivals. Per match, expected goals for and against come from the attack-vs-defense differential, and actual goals are drawn from a Poisson distribution off a seeded mulberry32. Draws fall out of that naturally, which is the whole point — an unbeaten season has to survive 38 chances to slip up, not just 38 rating comparisons.

The constants came out of `scripts/tune.ts`, a 10k-season Monte Carlo over flat-rated archetype XIs. Where it landed:

| draft | avg pts | champions | unbeaten | perfect |
|---|---|---|---|---|
| casual (82) | 78.3 | 1.1% | 0.0% | 0% |
| median (87) | 93.9 | 44.5% | 2.9% | 0.01% |
| strong (92) | 104.3 | 94.9% | 25.8% | 0.7% |
| god (97) | 110.1 | 99.7% | 62.4% | 15.3% |

I originally wanted the median draft to go unbeaten around 10% of the time. A 36-config grid search said that was never happening — median unbeaten tops out near 4% at any sane setting, because 38 games of real draw-and-upset math punish you eventually. I kept the math and dropped the target instead. Invincible is the name of the game; it should cost something.

## Sharing

A finished run compresses to a 35-character base64url code: version byte, formation id, 11 player ids, manager id. `/r/[code]` decodes it, re-runs the sim and renders the same result; `/api/og` draws the share card via `next/og` so links unfurl properly. Both are pure functions of the code, so the page is statically rendered on demand and the card is served `immutable` — a link that goes around a group chat is rendered once, not once per view. A bad or truncated code 404s to a branded page, and its card still unfurls as the game rather than a broken image.

**The code carries no seed, on purpose.** It used to. That meant the season was chosen at play time and travelled inside the URL, so anyone could iterate seeds and mint themselves a result: with the best legal XI a perfect 38-0-0 turned up on the fifth try, and an 80-rated squad — which goes unbeaten 0.02% of the time honestly — could reach Invincible in about 288,000 tries, a couple of seconds of compute. Now the seed is derived from the XI and the dugout (`lib/seed.ts`), so one team plays one season, forever. The ids are sorted before hashing, so shuffling two centre-backs between slots doesn't quietly hand you 800 more seasons to fish through. You can still hand-craft a code containing eleven elite players, but that forges "I drafted this XI", which the card shows, rather than "I got this result".

There is no database and no accounts. The URL *is* the save file.

## Data

1,983 players across 28 clubs and 133 club × decade pools, in `data/players/`. `scripts/validate-data.ts` enforces that every pool carries enough of each position that no spin can ever dead-end you — that invariant is also a vitest test, since a draft that can't be finished is the one bug that ruins a run outright.

The manifest in `lib/data.ts` is the thing to watch. Files are loaded by an explicit list, and the German pools sat committed but unlisted for a while — Bayern, Dortmund, Leverkusen and Hamburg were in the repo and absent from the game, which is why it ran 24 clubs and looked short. `tests/data.test.ts` now compares what's on disk against what's loaded, so a file can't go missing quietly again.

Text names only. No crests, no photos, no likenesses. Ratings are mine and are meant to be argued with.

## Stack

Next.js App Router, TypeScript, Tailwind, deployed on Vercel. The sim is written as a pluggable competition config so a Champions League group-and-knockout stage and a World Cup bracket can drop in later without touching the league path.

Set `NEXT_PUBLIC_SITE_URL` once there's a real domain. Without it the app falls back to Vercel's production domain (`VERCEL_PROJECT_PRODUCTION_URL`), which is stable across deploys — unlike `VERCEL_URL`, which would rot every share card on the next push. Web Analytics has to be switched on for the project in the Vercel dashboard; the script only loads on Vercel.

`npm audit` reports advisories in `postcss` and `sharp`. Both are inside Next's own dependency tree, `npm audit fix --force` "fixes" them by downgrading Next to 9.3.3, and neither is in this app's request path — sharp is build-time image optimization and this app ships no raster images. Leave them until Next ships a release that bumps them.
