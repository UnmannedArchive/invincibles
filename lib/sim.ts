import { mulberry32, poisson, type Rng } from './rng';
import { getFormation } from './formations';
import { LEAGUE, YOUR_CLUB, opponentName } from './opponents';
import type { Manager } from './managers';
import type { MatchResult, Player, Pos, SeasonResult, TableRow, Tier } from './types';

export interface SimConfig {
  /** league-average expected goals per side per match */
  baseGoals: number;
  /** how many rating points double-ish the goal expectancy */
  ratingScale: number;
  /** no team is ever safe: floor on expected goals either way */
  minXg: number;
  /** opponent strength ratings; each is faced twice */
  opponents: number[];
}

// Tuning knobs — validated against targets by scripts/tune.ts. Top-heavy opponent
// list on purpose: a handful of genuine title rivals is what makes perfect seasons rare.
export const DEFAULT_CONFIG: SimConfig = {
  baseGoals: 0.95,
  ratingScale: 12,
  minXg: 0.48,
  // Six relegation scrappers, ten midtable, three genuine title rivals.
  opponents: LEAGUE.map((club) => club.strength),
};

const ATTACK_WEIGHTS: Record<Pos, number> = { FW: 0.5, MF: 0.35, DF: 0.15, GK: 0 };
const DEFENSE_WEIGHTS: Record<Pos, number> = { GK: 0.35, DF: 0.45, MF: 0.2, FW: 0 };

function groupAverages(xi: Player[]): Record<Pos, number> {
  const sums: Record<Pos, { total: number; n: number }> = {
    GK: { total: 0, n: 0 },
    DF: { total: 0, n: 0 },
    MF: { total: 0, n: 0 },
    FW: { total: 0, n: 0 },
  };
  for (const p of xi) {
    sums[p.pos].total += p.rating;
    sums[p.pos].n++;
  }
  const avg = {} as Record<Pos, number>;
  for (const pos of ['GK', 'DF', 'MF', 'FW'] as Pos[]) {
    avg[pos] = sums[pos].n ? sums[pos].total / sums[pos].n : 0;
  }
  return avg;
}

export function teamRatings(xi: Player[]): { attack: number; defense: number } {
  const avg = groupAverages(xi);
  const weigh = (w: Record<Pos, number>) =>
    (['GK', 'DF', 'MF', 'FW'] as Pos[]).reduce((s, pos) => s + w[pos] * avg[pos], 0);
  return { attack: weigh(ATTACK_WEIGHTS), defense: weigh(DEFENSE_WEIGHTS) };
}

function expectedGoals(cfg: SimConfig, attack: number, defense: number): number {
  return Math.max(cfg.minXg, cfg.baseGoals * Math.exp((attack - defense) / cfg.ratingScale));
}

function playMatch(cfg: SimConfig, rng: Rng, atk: number, def: number, oppAtk: number, oppDef: number) {
  return {
    goalsFor: poisson(rng, expectedGoals(cfg, atk, oppDef)),
    goalsAgainst: poisson(rng, expectedGoals(cfg, oppAtk, def)),
  };
}

function assertXiMatchesFormation(xi: Player[], formationId: number) {
  const formation = getFormation(formationId);
  if (xi.length !== 11) throw new Error(`XI must have 11 players, got ${xi.length}`);
  for (const pos of ['GK', 'DF', 'MF', 'FW'] as Pos[]) {
    const want = formation.slots.filter((s) => s.pos === pos).length;
    const got = xi.filter((p) => p.pos === pos).length;
    if (want !== got) {
      throw new Error(`${formation.name} needs ${want} ${pos}, XI has ${got}`);
    }
  }
}

export function computeTier(wins: number, draws: number, losses: number, position: number): Tier {
  if (wins > 0 && draws === 0 && losses === 0) return 'perfect';
  if (position === 1 && losses === 0) return 'invincible';
  if (position === 1) return 'champions';
  return 'none';
}

export function simulateSeason(
  xi: Player[],
  formationId: number,
  seed: number,
  manager: Manager | null = null,
  cfg: SimConfig = DEFAULT_CONFIG,
): SeasonResult {
  assertXiMatchesFormation(xi, formationId);
  const rng = mulberry32(seed);
  const base = teamRatings(xi);
  // The dugout is worth a few rating points at each end of the pitch.
  const attack = base.attack + (manager?.attack ?? 0);
  const defense = base.defense + (manager?.defense ?? 0);
  const n = cfg.opponents.length;

  // Each opponent twice, shuffled off the same seed: the run of fixtures is
  // part of the season, and no season ends against the same two title rivals.
  const fixtures: number[] = [];
  for (let i = 0; i < n; i++) fixtures.push(i, i);
  for (let i = fixtures.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [fixtures[i], fixtures[j]] = [fixtures[j], fixtures[i]];
  }

  const matches: MatchResult[] = fixtures.map((opponentIndex) => {
    const strength = cfg.opponents[opponentIndex];
    const { goalsFor, goalsAgainst } = playMatch(cfg, rng, attack, defense, strength, strength);
    return { opponentIndex, goalsFor, goalsAgainst };
  });

  let wins = 0;
  let draws = 0;
  let losses = 0;
  const oppTable = cfg.opponents.map(() => ({ pts: 0, gd: 0, gf: 0 }));
  matches.forEach((m) => {
    const opp = oppTable[m.opponentIndex];
    if (m.goalsFor > m.goalsAgainst) {
      wins++;
    } else if (m.goalsFor < m.goalsAgainst) {
      losses++;
      opp.pts += 3;
    } else {
      draws++;
      opp.pts += 1;
    }
    opp.gd += m.goalsAgainst - m.goalsFor;
    opp.gf += m.goalsAgainst;
  });

  // Opponents' round robin (each pair twice) fills out the league table.
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const a = cfg.opponents[i];
      const b = cfg.opponents[j];
      const { goalsFor, goalsAgainst } = playMatch(cfg, rng, a, a, b, b);
      if (goalsFor > goalsAgainst) oppTable[i].pts += 3;
      else if (goalsFor < goalsAgainst) oppTable[j].pts += 3;
      else {
        oppTable[i].pts += 1;
        oppTable[j].pts += 1;
      }
      oppTable[i].gd += goalsFor - goalsAgainst;
      oppTable[i].gf += goalsFor;
      oppTable[j].gd += goalsAgainst - goalsFor;
      oppTable[j].gf += goalsAgainst;
    }
  }

  const points = 3 * wins + draws;
  const goalsFor = matches.reduce((s, m) => s + m.goalsFor, 0);
  const goalsAgainst = matches.reduce((s, m) => s + m.goalsAgainst, 0);
  const gd = goalsFor - goalsAgainst;

  // Ties break in our favour: only strictly better clubs finish above us.
  const table: TableRow[] = [
    ...oppTable.map((t, i) => ({
      name: opponentName(i),
      points: t.pts,
      goalsFor: t.gf,
      goalDiff: t.gd,
      isYou: false,
    })),
    { name: YOUR_CLUB, points, goalsFor, goalDiff: gd, isYou: true },
  ].sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      Number(b.isYou) - Number(a.isYou),
  );
  const position = table.findIndex((row) => row.isYou) + 1;

  return {
    matches,
    table,
    wins,
    draws,
    losses,
    points,
    goalsFor,
    goalsAgainst,
    position,
    tier: computeTier(wins, draws, losses, position),
  };
}
