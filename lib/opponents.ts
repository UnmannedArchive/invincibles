export interface OpponentClub {
  name: string;
  short: string;
  strength: number;
}

/**
 * The nineteen clubs you play twice each. Invented on purpose — the draft pools
 * are real footballers, but the league you drop them into is not anyone's, so
 * nobody's actual club is being simulated to a relegation. Ordered weakest to
 * strongest; the strengths are the tuned ladder the sim runs on.
 */
export const LEAGUE: OpponentClub[] = [
  { name: 'Cradley Rovers', short: 'CRA', strength: 66 },
  { name: 'Fenmarsh Town', short: 'FEN', strength: 67 },
  { name: 'Barrowfield United', short: 'BRF', strength: 68 },
  { name: 'Kesteven City', short: 'KES', strength: 69 },
  { name: 'Ashcombe Athletic', short: 'ASH', strength: 70 },
  { name: 'Dunmarch Wanderers', short: 'DUN', strength: 71 },
  { name: 'Halworth Town', short: 'HAL', strength: 72 },
  { name: 'Pentrave City', short: 'PEN', strength: 73 },
  { name: 'Marlow Vale', short: 'MRV', strength: 74 },
  { name: 'Thornbury United', short: 'THB', strength: 75 },
  { name: 'Redgate Athletic', short: 'RDG', strength: 76 },
  { name: 'Aldergate', short: 'ALD', strength: 77 },
  { name: 'Northmere City', short: 'NRM', strength: 78 },
  { name: 'Kingsholm United', short: 'KGH', strength: 79 },
  { name: 'Stanmoor Rovers', short: 'STN', strength: 80 },
  { name: 'Whitcombe Town', short: 'WHT', strength: 81 },
  { name: 'Real Valmonte', short: 'RVM', strength: 83 },
  { name: 'Sporting Calvara', short: 'SPC', strength: 85 },
  { name: 'FC Nordhaven', short: 'NDH', strength: 87 },
];

/** Your own side, as it appears on the table and the ticker. */
export const YOUR_CLUB = 'Invincibles';

export function opponentName(index: number): string {
  return LEAGUE[index]?.name ?? `Club ${index + 1}`;
}
