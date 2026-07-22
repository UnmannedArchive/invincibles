import { PLAYERS } from './data';
import type { Player } from './types';

// Nobiliary particles belong to the surname: van Dijk, Di Maria, van der Sar.
// Taking the last word alone turned those into Dijk, Maria and Sar.
const PARTICLES = new Set([
  'van', 'von', 'de', 'del', 'della', 'di', 'da', 'das', 'dos', 'du',
  'der', 'den', 'ter', 'ten', 'la', 'le', 'el', 'al', 'bin', 'ibn',
]);

/**
 * Players the football world knows by something other than their surname.
 * Kept deliberately short — it's for names the rules below get wrong, not a
 * place to relitigate what anyone is called.
 */
const KNOWN_AS: Record<string, string> = {
  'Julio Cesar da Silva': 'Julio Cesar',
  'Vinicius Junior': 'Vinicius Jr',
  'Juninho Pernambucano': 'Juninho',
  'Roberto Carlos': 'Roberto Carlos',
};

export function surnameOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  let start = parts.length - 1;
  while (start > 0 && PARTICLES.has(parts[start - 1].toLowerCase())) start--;
  return parts.slice(start).join(' ');
}

// Built once over the whole dataset: how many *people* answer to each surname,
// and to each "initial + surname", so a card can pick the shortest label that
// still identifies one of them. Counted over distinct names, since one player
// appears in a pool for every decade they were any good.
const surnameCounts = new Map<string, number>();
const initialCounts = new Map<string, number>();
for (const name of new Set(PLAYERS.map((p) => p.name))) {
  const surname = surnameOf(name);
  const initialed = `${name.trim()[0]}. ${surname}`;
  surnameCounts.set(surname, (surnameCounts.get(surname) ?? 0) + 1);
  initialCounts.set(initialed, (initialCounts.get(initialed) ?? 0) + 1);
}

/**
 * What goes on the card. Surname alone where that's unambiguous, an initial
 * where it isn't (four Silvas otherwise read identically), and the full name
 * where even the initial collides — Dani and Diego Alves are both D. Alves.
 */
export function displayName(player: Player): string {
  const known = KNOWN_AS[player.name];
  if (known) return known;

  const surname = surnameOf(player.name);
  if ((surnameCounts.get(surname) ?? 0) <= 1) return surname;

  const initialed = `${player.name.trim()[0]}. ${surname}`;
  if ((initialCounts.get(initialed) ?? 0) <= 1) return initialed;

  return player.name;
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
