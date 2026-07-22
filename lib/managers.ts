export type Touchline = 'attacking' | 'balanced' | 'defensive';

export interface Manager {
  id: number;
  name: string;
  club: string;
  era: string;
  rating: number;
  style: Touchline;
  /** rating points added to the team's attack and defense */
  attack: number;
  defense: number;
}

/**
 * The dugout. A manager is the last pick of a draft and the only one that
 * touches both ends of the team: attacking coaches buy you goals, defensive
 * ones buy you clean sheets, and the great all-rounders give a bit of each.
 *
 * Bonuses are small on purpose — 3 rating points is worth roughly a tier of
 * player, enough to decide a title race without out-weighing the XI.
 */
export const MANAGERS: Manager[] = [
  { id: 1, name: 'Alex Ferguson', club: 'Manchester United', era: '1990s', rating: 95, style: 'balanced', attack: 2, defense: 2 },
  { id: 2, name: 'Pep Guardiola', club: 'Barcelona', era: '2010s', rating: 95, style: 'attacking', attack: 4, defense: 1 },
  { id: 3, name: 'Johan Cruyff', club: 'Barcelona', era: '1990s', rating: 92, style: 'attacking', attack: 4, defense: 0 },
  { id: 4, name: 'Arrigo Sacchi', club: 'AC Milan', era: '1980s', rating: 91, style: 'attacking', attack: 3, defense: 1 },
  { id: 5, name: 'Carlo Ancelotti', club: 'Real Madrid', era: '2010s', rating: 92, style: 'balanced', attack: 2, defense: 2 },
  { id: 6, name: 'Jurgen Klopp', club: 'Liverpool', era: '2010s', rating: 92, style: 'attacking', attack: 3, defense: 1 },
  { id: 7, name: 'Bob Paisley', club: 'Liverpool', era: '1970s', rating: 91, style: 'balanced', attack: 2, defense: 2 },
  { id: 8, name: 'Jose Mourinho', club: 'Chelsea', era: '2000s', rating: 91, style: 'defensive', attack: 1, defense: 4 },
  { id: 9, name: 'Arsene Wenger', club: 'Arsenal', era: '1990s', rating: 90, style: 'attacking', attack: 3, defense: 1 },
  { id: 10, name: 'Rinus Michels', club: 'Barcelona', era: '1970s', rating: 90, style: 'attacking', attack: 4, defense: 0 },
  { id: 11, name: 'Marcello Lippi', club: 'Juventus', era: '1990s', rating: 89, style: 'balanced', attack: 2, defense: 2 },
  { id: 12, name: 'Fabio Capello', club: 'AC Milan', era: '1990s', rating: 89, style: 'defensive', attack: 1, defense: 3 },
  { id: 13, name: 'Diego Simeone', club: 'Atletico Madrid', era: '2010s', rating: 89, style: 'defensive', attack: 0, defense: 4 },
  { id: 14, name: 'Jupp Heynckes', club: 'Bayern Munich', era: '2010s', rating: 89, style: 'balanced', attack: 2, defense: 2 },
  { id: 15, name: 'Bill Shankly', club: 'Liverpool', era: '1970s', rating: 89, style: 'balanced', attack: 2, defense: 1 },
  { id: 16, name: 'Giovanni Trapattoni', club: 'Juventus', era: '1980s', rating: 88, style: 'defensive', attack: 1, defense: 3 },
  { id: 17, name: 'Helenio Herrera', club: 'Inter Milan', era: '1970s', rating: 88, style: 'defensive', attack: 0, defense: 4 },
  { id: 18, name: 'Valeriy Lobanovskyi', club: 'Dynamo Kyiv', era: '1980s', rating: 88, style: 'balanced', attack: 2, defense: 2 },
  { id: 19, name: 'Ottmar Hitzfeld', club: 'Borussia Dortmund', era: '1990s', rating: 88, style: 'balanced', attack: 2, defense: 1 },
  { id: 20, name: 'Brian Clough', club: 'Nottingham Forest', era: '1970s', rating: 88, style: 'balanced', attack: 2, defense: 2 },
  { id: 21, name: 'Vicente del Bosque', club: 'Real Madrid', era: '2000s', rating: 88, style: 'balanced', attack: 2, defense: 1 },
  { id: 22, name: 'Antonio Conte', club: 'Juventus', era: '2010s', rating: 87, style: 'defensive', attack: 1, defense: 3 },
  { id: 23, name: 'Louis van Gaal', club: 'Barcelona', era: '1990s', rating: 87, style: 'attacking', attack: 3, defense: 1 },
  { id: 24, name: 'Zinedine Zidane', club: 'Real Madrid', era: '2010s', rating: 87, style: 'balanced', attack: 2, defense: 1 },
  { id: 25, name: 'Ernst Happel', club: 'Hamburger SV', era: '1980s', rating: 86, style: 'balanced', attack: 2, defense: 1 },
  { id: 26, name: 'Udo Lattek', club: 'Bayern Munich', era: '1970s', rating: 86, style: 'balanced', attack: 1, defense: 2 },
  { id: 27, name: 'Massimiliano Allegri', club: 'Juventus', era: '2010s', rating: 86, style: 'defensive', attack: 1, defense: 3 },
  { id: 28, name: 'Luis Aragones', club: 'Atletico Madrid', era: '2000s', rating: 85, style: 'balanced', attack: 2, defense: 1 },
  { id: 29, name: 'Nereo Rocco', club: 'AC Milan', era: '1970s', rating: 85, style: 'defensive', attack: 0, defense: 3 },
  { id: 30, name: 'Aime Jacquet', club: 'Marseille', era: '1990s', rating: 85, style: 'defensive', attack: 1, defense: 3 },
];

const byId = new Map(MANAGERS.map((m) => [m.id, m]));

export function managerById(id: number): Manager | undefined {
  return byId.get(id);
}

/** The shortlist a draft offers for the final pick. */
export function managerShortlist(rng: () => number, size = 4): Manager[] {
  const pool = [...MANAGERS];
  const picked: Manager[] = [];
  for (let i = 0; i < size && pool.length > 0; i++) {
    picked.push(...pool.splice(Math.floor(rng() * pool.length), 1));
  }
  return picked;
}
