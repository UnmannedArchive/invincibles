import { describe, expect, test } from 'vitest';
import { CLUB_STYLE, LEAGUES, clubStyle, leagueOf } from '../lib/clubs';
import { PLAYERS } from '../lib/data';

const CLUBS = [...new Set(PLAYERS.map((p) => p.club))].sort();

describe('club styles', () => {
  test('every club in the dataset has kit colours', () => {
    const missing = CLUBS.filter((club) => !CLUB_STYLE[club]);
    expect(missing).toEqual([]);
  });

  test('no style entry names a club that does not exist', () => {
    const stray = Object.keys(CLUB_STYLE).filter((club) => !CLUBS.includes(club));
    expect(stray).toEqual([]);
  });

  test('colours are hex and the two are never identical', () => {
    for (const club of CLUBS) {
      const style = clubStyle(club);
      expect(style.primary).toMatch(/^#[0-9a-f]{6}$/);
      expect(style.secondary).toMatch(/^#[0-9a-f]{6}$/);
      expect(style.primary).not.toBe(style.secondary);
    }
  });

  test('every club maps to a league flag', () => {
    for (const club of CLUBS) {
      const league = leagueOf(club);
      expect(league.name.length).toBeGreaterThan(0);
      expect(league.bands.length).toBeGreaterThan(1);
    }
  });

  test('all five leagues are represented', () => {
    const countries = new Set(CLUBS.map((c) => clubStyle(c).country));
    expect([...countries].sort()).toEqual(['ENG', 'ESP', 'FRA', 'GER', 'ITA']);
  });

  test('an unknown club falls back rather than throwing', () => {
    expect(() => clubStyle('Not A Club')).not.toThrow();
    expect(clubStyle('Not A Club').primary).toMatch(/^#[0-9a-f]{6}$/);
  });

  test('flag bands are hex', () => {
    for (const league of Object.values(LEAGUES)) {
      for (const band of league.bands) expect(band).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
