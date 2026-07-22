import { getFormation } from './formations';
import { managerById } from './managers';
import type { RunState } from './run';
import type { SeasonResult, Tier } from './types';

export const SQUARES = {
  win: '🟩',
  draw: '🟨',
  loss: '🟥',
} as const;

const TIER_LINE: Record<Tier, string> = {
  perfect: 'PERFECT SEASON',
  invincible: 'INVINCIBLE',
  champions: 'CHAMPIONS',
  none: '',
};

function ordinal(n: number): string {
  const suffix = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

const ROW = 10;

/**
 * The block you paste into a group chat. A link on its own asks someone to
 * click before they know whether it's worth it; 38 coloured squares tell the
 * whole story of a season first, and carry the link along behind them.
 */
export function shareText(run: RunState, result: SeasonResult, url: string): string {
  const formation = getFormation(run.formationId);
  const manager = run.managerId === null ? null : managerById(run.managerId);

  const head = ['INVINCIBLES', formation.name, manager?.name].filter(Boolean).join(' · ');

  const tier = TIER_LINE[result.tier];
  const record = `${result.wins}W ${result.draws}D ${result.losses}L · ${result.points} pts · ${ordinal(result.position)}`;

  const squares = result.matches.map((m) =>
    m.goalsFor > m.goalsAgainst
      ? SQUARES.win
      : m.goalsFor < m.goalsAgainst
        ? SQUARES.loss
        : SQUARES.draw,
  );
  const rows: string[] = [];
  for (let i = 0; i < squares.length; i += ROW) {
    rows.push(squares.slice(i, i + ROW).join(''));
  }

  // A beaten season has no tier line, and shouldn't leave a gap where one would be.
  const lines = tier ? [head, tier, record] : [head, record];
  return [...lines, '', ...rows, '', url].join('\n');
}
