import { replayFromCode } from './replay';
import { surnameOf } from './kit';
import type { Tier } from './types';

/**
 * Multiplayer without a backend.
 *
 * A league is just a set of runs — everyone drafts their own XI, and their
 * share code goes into one link. This file decodes those codes, replays each
 * season (the opponents are the same nineteen invented clubs for everyone, so
 * records are directly comparable), and ranks the managers against each other.
 * No database, no accounts: the URL is still the whole save file, only now it
 * holds a table instead of a team.
 */

export interface LeagueEntry {
  /** the player's chosen name; '' means "use the manager's" */
  handle: string;
  code: string;
}

export interface Standing {
  rank: number;
  handle: string;
  code: string;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  position: number; // their finish in their own 20-team league
  tier: Tier;
}

export interface League {
  standings: Standing[];
  size: number;
  unreadable: number;
  bestAttack: Standing | null;
  bestDefense: Standing | null;
}

const HANDLE_MAX = 14;

/** Handles live in a URL path and get shown to other people: letters and digits only. */
export function sanitizeHandle(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, '').slice(0, HANDLE_MAX);
}

/**
 * Path segments → entries. A segment is `handle~code`, or a bare `code` for an
 * anonymous entry. The split is on the first tilde only, because a base64url
 * code never contains one but does contain `-` and `_`.
 */
export function parseEntries(segments: string[]): LeagueEntry[] {
  const entries: LeagueEntry[] = [];
  for (const segment of segments) {
    if (!segment) continue;
    const tilde = segment.indexOf('~');
    if (tilde === -1) {
      entries.push({ handle: '', code: segment });
    } else {
      entries.push({ handle: segment.slice(0, tilde), code: segment.slice(tilde + 1) });
    }
  }
  return entries;
}

/** Entries → path segments, ready to join with '/'. */
export function buildLeaguePath(entries: LeagueEntry[]): string[] {
  return entries.map((e) => {
    const handle = sanitizeHandle(e.handle);
    return handle ? `${handle}~${e.code}` : e.code;
  });
}

export function standings(entries: LeagueEntry[]): League {
  const rows: Omit<Standing, 'rank'>[] = [];
  let unreadable = 0;

  for (const entry of entries) {
    const replay = replayFromCode(entry.code);
    if (!replay) {
      unreadable++;
      continue;
    }
    const { result, manager, xi } = replay;
    const handle =
      sanitizeHandle(entry.handle) ||
      (manager ? surnameOf(manager.name) : surnameOf(topRated(xi).name));

    rows.push({
      handle,
      code: entry.code,
      wins: result.wins,
      draws: result.draws,
      losses: result.losses,
      points: result.points,
      goalsFor: result.goalsFor,
      goalsAgainst: result.goalsAgainst,
      goalDiff: result.goalsFor - result.goalsAgainst,
      position: result.position,
      tier: result.tier,
    });
  }

  // Same order as a real table, with a stable final tiebreak so the standings
  // don't reshuffle between renders of the same league.
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalDiff - a.goalDiff ||
      b.goalsFor - a.goalsFor ||
      a.handle.localeCompare(b.handle) ||
      a.code.localeCompare(b.code),
  );

  const ranked: Standing[] = rows.map((row, i) => ({ ...row, rank: i + 1 }));

  const bestAttack = pick(ranked, (a, b) => b.goalsFor - a.goalsFor);
  const bestDefense = pick(ranked, (a, b) => a.goalsAgainst - b.goalsAgainst);

  return { standings: ranked, size: ranked.length, unreadable, bestAttack, bestDefense };
}

function topRated<T extends { rating: number }>(players: T[]): T {
  return players.reduce((best, p) => (p.rating > best.rating ? p : best));
}

function pick(rows: Standing[], cmp: (a: Standing, b: Standing) => number): Standing | null {
  if (rows.length === 0) return null;
  return [...rows].sort(cmp)[0];
}
