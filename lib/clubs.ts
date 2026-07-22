export type Country = 'ENG' | 'ESP' | 'ITA' | 'GER' | 'FRA';
export type KitPattern = 'solid' | 'stripes' | 'halves' | 'hoops' | 'sash' | 'sleeves';

export interface ClubStyle {
  country: Country;
  /** shirt base */
  primary: string;
  /** stripes, sleeves, sash, trim */
  secondary: string;
  pattern: KitPattern;
}

/**
 * Kit colours and pattern for every club in the dataset.
 *
 * Deliberately *not* crests or league logos: those are trademarked artwork and
 * this game doesn't have a licence for them. Colours and the shape of a shirt
 * are facts about a club — Juventus play in stripes, PSG wear a sash — so the
 * badge art here is drawn from those, generated rather than copied.
 */
export const CLUB_STYLE: Record<string, ClubStyle> = {
  // England
  'Manchester United': { country: 'ENG', primary: '#da291c', secondary: '#fbe122', pattern: 'solid' },
  Liverpool: { country: 'ENG', primary: '#c8102e', secondary: '#f6eb61', pattern: 'solid' },
  Arsenal: { country: 'ENG', primary: '#ef0107', secondary: '#ffffff', pattern: 'sleeves' },
  Chelsea: { country: 'ENG', primary: '#034694', secondary: '#ffffff', pattern: 'solid' },
  'Manchester City': { country: 'ENG', primary: '#6cabdd', secondary: '#ffffff', pattern: 'solid' },
  'Tottenham Hotspur': { country: 'ENG', primary: '#ffffff', secondary: '#132257', pattern: 'solid' },
  'Newcastle United': { country: 'ENG', primary: '#241f20', secondary: '#ffffff', pattern: 'stripes' },
  'Leeds United': { country: 'ENG', primary: '#ffffff', secondary: '#1d428a', pattern: 'solid' },

  // Spain
  'Real Madrid': { country: 'ESP', primary: '#ffffff', secondary: '#febe10', pattern: 'solid' },
  Barcelona: { country: 'ESP', primary: '#004d98', secondary: '#a50044', pattern: 'stripes' },
  'Atletico Madrid': { country: 'ESP', primary: '#cb3524', secondary: '#ffffff', pattern: 'stripes' },
  Valencia: { country: 'ESP', primary: '#ffffff', secondary: '#f18e00', pattern: 'solid' },
  Sevilla: { country: 'ESP', primary: '#ffffff', secondary: '#d81920', pattern: 'solid' },

  // Italy
  Juventus: { country: 'ITA', primary: '#ffffff', secondary: '#000000', pattern: 'stripes' },
  'AC Milan': { country: 'ITA', primary: '#fb090b', secondary: '#000000', pattern: 'stripes' },
  'Inter Milan': { country: 'ITA', primary: '#0068a8', secondary: '#000000', pattern: 'stripes' },
  Napoli: { country: 'ITA', primary: '#12a0d7', secondary: '#ffffff', pattern: 'solid' },
  Roma: { country: 'ITA', primary: '#8e1f2f', secondary: '#f0bc42', pattern: 'solid' },
  Lazio: { country: 'ITA', primary: '#87d8f7', secondary: '#ffffff', pattern: 'solid' },

  // Germany
  'Bayern Munich': { country: 'GER', primary: '#dc052d', secondary: '#ffffff', pattern: 'solid' },
  'Borussia Dortmund': { country: 'GER', primary: '#fde100', secondary: '#000000', pattern: 'solid' },
  'Bayer Leverkusen': { country: 'GER', primary: '#e32219', secondary: '#000000', pattern: 'solid' },
  'Hamburger SV': { country: 'GER', primary: '#ffffff', secondary: '#0a2d82', pattern: 'sash' },

  // France
  'Paris Saint-Germain': { country: 'FRA', primary: '#004170', secondary: '#da291c', pattern: 'sash' },
  Marseille: { country: 'FRA', primary: '#ffffff', secondary: '#2faee0', pattern: 'solid' },
  Lyon: { country: 'FRA', primary: '#ffffff', secondary: '#0f4c9c', pattern: 'solid' },
  Monaco: { country: 'FRA', primary: '#e51b22', secondary: '#ffffff', pattern: 'halves' },
  'Saint-Etienne': { country: 'FRA', primary: '#009a44', secondary: '#ffffff', pattern: 'solid' },
};

const FALLBACK: ClubStyle = {
  country: 'ENG',
  primary: '#5b6b86',
  secondary: '#eef4ff',
  pattern: 'solid',
};

export function clubStyle(club: string): ClubStyle {
  return CLUB_STYLE[club] ?? FALLBACK;
}

export interface League {
  name: string;
  /** flag bands, left to right for vertical flags, top to bottom for horizontal */
  bands: string[];
  orientation: 'vertical' | 'horizontal' | 'cross';
}

/**
 * National flags stand in for league marks. Flags of nations aren't anyone's
 * copyright, and the country is what actually tells you where a club played.
 */
export const LEAGUES: Record<Country, League> = {
  ENG: { name: 'England', bands: ['#ffffff', '#ce1124'], orientation: 'cross' },
  ESP: { name: 'Spain', bands: ['#aa151b', '#f1bf00', '#aa151b'], orientation: 'horizontal' },
  ITA: { name: 'Italy', bands: ['#008c45', '#f4f5f0', '#cd212a'], orientation: 'vertical' },
  GER: { name: 'Germany', bands: ['#000000', '#dd0000', '#ffce00'], orientation: 'horizontal' },
  FRA: { name: 'France', bands: ['#002395', '#ffffff', '#ed2939'], orientation: 'vertical' },
};

export function leagueOf(club: string): League {
  return LEAGUES[clubStyle(club).country];
}
