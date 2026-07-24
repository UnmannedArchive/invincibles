# What Invincibles should do next

*Written 2026-07-22, after the ship-readiness pass. Ordered by what it does for the person playing, not by what's fun to build.*

The game is complete and honest now: you draft an XI, it plays one season it can't wriggle out of, and the link you send proves it. What it isn't yet is a game you play twice. Everything below is aimed at that.

---

## 1. Give the draft a decision to make — chemistry

> **Deferred — Joseph's call, 2026-07-22.** Not being built for now. Leaving the reasoning below intact so the case is here when it's wanted.


**The problem:** right now there is no choice. Every spin, you take the highest-rated eligible player, and that is always correct. The pick sheet sorts by rating, so the right answer is literally the first card. Eleven spins of picking the top card is a slot machine, not a draft.

**The fix, and it's the FIFA one:** chemistry links. A pick that shares a club or a decade with players you already have is worth more than its rating suggests. Suddenly the 84 from the same club as your back line beats the 88 from nowhere, and every spin is a real trade.

Concretely: compute a chemistry score over the XI (shared club, shared decade, shared league), let it scale the team's attack and defense by a few points, and show each card's link count while you're choosing. The sim already takes ratings and returns a season — chemistry is a multiplier in `teamRatings`, maybe forty lines including tests.

This is the single highest-value change on this list. It converts the core loop from "tap the top card" into a game with regret in it, which is also what makes a run worth sharing.

## 2. Show the season you *didn't* get

> **Shipped 2026-07-22.** `lib/outlook.ts` replays the XI across 1,000 seeds; the result page shows the distribution with your season marked, plus how often this squad wins the league, goes unbeaten and wins all 38.

Each XI now plays exactly one season, which is the right call for honesty but hides how good the team actually was — a great XI can still draw four and lose the title, and the player has no way to know whether they were unlucky.

Run the same XI across ~1,000 seeds client-side (the sim does 10k in seconds) and show the distribution of points with your actual season marked on it: *"this XI wins the league 62% of the time. You got the 11th percentile."* Being robbed is more shareable than winning, and it costs nothing — no database, no server, just the engine already in the bundle.

Worth using the dataviz guidance for the chart rather than dropping in a default bar chart.

## 3. A daily draft

The Wordle mechanic, and this game is shaped for it: derive the day's eleven spins from the date, so everyone in the world gets the same eleven club × decade pools and has to build the best XI from them. Now two links are comparable — same pools, different choices — which is the conversation the current game can't have, because your spins and mine were different.

No database needed: the date *is* the seed. `/daily` plus a "today's draft" badge on the result card.

## 4. Make the share text as good as the share link

> **Shipped 2026-07-22.** `lib/share.ts`. Uses the Web Share sheet on mobile and the clipboard everywhere else.

Right now the button copies a URL. Wordle spread on a **text block** people could paste anywhere, no click required. Copy something like:

```
INVINCIBLES · 4-3-3 · 2026-07-22
32W 6D 0L — INVINCIBLE
🟩🟩🟩🟨🟩🟩🟩🟩🟩🟨🟩🟩🟩...
invincibles.app/r/AgATwhQ...
```

A row of squares for the 38 results is instantly legible in a group chat and drags the link along behind it. Half a day's work, and it is probably the highest ratio of reach to effort here.

## 5. Multiplayer league — SHIPPED 2026-07-24

> `lib/league.ts` + `/l/[...entries]`. A league is a bundle of share codes in the URL — everyone drafts their own XI, adds their code, and the page ranks all teams by record with best-attack/meanest-defence superlatives and Champions/Invincible/Perfect badges. No backend: the URL is still the whole save file. "Add your team" carries the league through a fresh draft (sessionStorage) and appends you on finish; rotted codes are dropped so links self-heal. Head-to-head is just a two-team league, so it's covered.

## 5b. Head-to-head (its own screen)

`/vs/[codeA]/[codeB]`: take two shared XIs and play them against each other. Everything needed already exists — both codes decode to real XIs, the sim already plays a match between two rating pairs. It turns "look at my team" into "my team beats yours", which is the argument people actually want to have.

## 6. Result-page detail worth screenshotting

The result gives you a record, a table and your XI. It doesn't tell you the story: the 5–0 that announced the season, the one defeat that cost the Invincible tag, the game where you dropped points to the bottom club. The match data is already there — surface three or four of these as a short "season in brief". This is the cheapest way to make the page worth a screenshot rather than a glance.

## 7. Gaps I'd close before pushing this hard

Honest list of what's still rough, from working through the code:

- **No custom analytics events.** Vercel Analytics is wired in but only counts page views. The number that matters is *what fraction of people who start a draft finish it* — instrument start / pick / complete / share, or you'll be guessing at what to fix next.
- **No home-screen identity.** There's an icon but no `apple-icon` or web manifest, so "add to home screen" looks unfinished on iOS.
- **The 38-match reveal is ~4.5s and has a skip, but it's the same every time.** Second-time players will skip it every time; consider making the skip sticky (remember the preference).

## 8. Later, and only if it lands

The competition config was built pluggable for a reason, and the design doc already reserves these: a Champions League group-and-knockout stage, then a World Cup bracket with a national-team dataset. They're worth holding as re-trend drops rather than launch scope — each is a reason to post about the game again a month later.

A leaderboard is the obvious ask and the one I'd resist longest: it needs a database, accounts or fingerprinting, and moderation, and it breaks the "the URL is the save file" property that makes this thing cheap to run and impossible to break. The daily draft gets most of the competitive feeling for none of that cost.
