import type { Player } from './types';

export function shirtNumber(slotIndex: number): number {
  // Slot order runs GK → defence → midfield → attack, so 1..11 reads as a
  // conventional team sheet (keeper 1, back line 2-5, and so on).
  return slotIndex + 1;
}

export function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts[parts.length - 1];
}

/** Club monogram, standing in for a crest we deliberately don't ship. */
export function monogramOf(club: string): string {
  const words = club.split(/\s+/).filter((w) => !/^(fc|sv|ac|as|ss|rc)$/i.test(w));
  const parts = words.length ? words : club.split(/\s+/);
  // One-word clubs read better as three letters (VAL) than as one (V).
  const letters = parts.length === 1 ? parts[0].slice(0, 3) : parts.map((w) => w[0]).join('');
  return letters.slice(0, 3).toUpperCase();
}

export type CardTier = 'toty' | 'gold' | 'silver' | 'bronze';

/**
 * Tiers are cut to this dataset (ratings run 70–98, median 81), not to FUT's
 * bronze/silver/gold thresholds: 90+ lands about 5% of the pool, so pulling
 * one out of a spin should feel like pulling a Team of the Year card.
 */
export function tierOf(rating: number): CardTier {
  if (rating >= 90) return 'toty';
  if (rating >= 85) return 'gold';
  if (rating >= 80) return 'silver';
  return 'bronze';
}

export function eraOf(player: Player): string {
  return player.decade;
}
