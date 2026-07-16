# Invincibles — design spec

*2026-07-15. Validated through brainstorming; implementation plan lives at `~/.claude/plans/optimized-hopping-boot.md` (approved same day).*

## What this is

A soccer version of **82-0** (82-0.com), the viral NBA browser game. Same exact loop: spin a wheel → land on a team × decade → pick **one** player for one open slot → repeat until the lineup is full → simulate a season chasing perfection. Goal: a viral shot that doubles as a portfolio piece.

## Game rules

- **Universe:** ~32 iconic big-5-league clubs × 6 decades (1970s–2020s) ≈ 190 spin pools.
- **Draft:** pick a formation (4-3-3, 4-4-2, or 3-5-2), then 11 spins. Each spin lands on a club × decade; pick exactly one player who fits an open slot. Duplicate club×decade spins allowed; already-picked players are removed from future pools. No re-spins.
- **Season:** a 38-match league season (the soccer analog of 82 games), simulated deterministically from your XI + a seed.
- **Achievement ladder:** Champions (win the league) → **Invincible** (zero losses) → **Perfect Season 38-0-0** (the grail, tuned to be rare even for god-tier drafts).

## Simulation

Pure, seeded, deterministic: `simulateSeason(xi, formation, seed)`. Attack rating weights FW > MF > DF; defense weights DF + GK > MF. 19 opponents of spread strengths, each faced twice; per-match goals sampled from Poisson distributions driven by attack-vs-defense differentials, so draws happen naturally. Constants tuned via Monte Carlo (`scripts/tune.ts`). Achieved curve (flat-rated archetype XIs, 10k seasons): 82 → 1% champions; 87 → 44% champions / 2.6% invincible; 92 → 95% / 26% / 0.8% perfect; 97 → 99.8% / 63% / ~16% perfect. *Note:* the original "median draft goes unbeaten ~10%" target was amended after a 36-config grid search showed median unbeaten never exceeds ~4% at any sane config — 38 matches of real draw/upset math make unbeaten seasons inherently elite, which fits the game: Invincible is the namesake tier and should demand a strong draft.

## Data

`data/players.json`: ~3,000 players — `{ id, name, pos: GK|DF|MF|FW, rating: 1-99, club, decade }`. AI-drafted pool by pool, spot-checked. Validator (`scripts/validate-data.ts`) enforces every pool has ≥2 GK and ≥4 of each outfield group so no spin can dead-end. Text names only — no crests, photos, or likenesses; custom generic badge art.

## Sharing (the viral mechanic)

A finished run compresses to a short base64url code (formation + 11 player ids + seed). `/r/[code]` re-runs the sim and renders the result; `/api/og` renders a share-card image (XI on a pitch + record + tier) via `next/og` ImageResponse so links unfurl on X/iMessage/Discord.

## Architecture

Next.js App Router + TypeScript + Tailwind on Vercel. **No database, no accounts** — fully static app + one OG image route; the URL is the only persistence. Sim engine is a pluggable "competition config" so v2 stages slot in.

## v2 (explicitly out of scope now)

Champions League stage (group + knockouts, extra time/pens), World Cup bracket, leaderboards, national-team dataset — each a future re-trend drop.
