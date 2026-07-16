export type Pos = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  id: number;
  name: string;
  pos: Pos;
  rating: number; // 1-99
  club: string;
  decade: string; // e.g. "1990s"
}

export interface Slot {
  pos: Pos;
  /** pitch coordinates as percentages, x: 0 left goal line → 100 right, y: 0 top touchline → 100 bottom */
  x: number;
  y: number;
}

export interface Formation {
  id: number;
  name: string;
  slots: Slot[];
}

export interface MatchResult {
  opponent: number; // opponent strength rating
  goalsFor: number;
  goalsAgainst: number;
}

export type Tier = 'none' | 'champions' | 'invincible' | 'perfect';

export interface SeasonResult {
  matches: MatchResult[];
  wins: number;
  draws: number;
  losses: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  position: number; // final league position, 1-20
  tier: Tier;
}
