import { describe, expect, test } from 'vitest';
import { displayName, monogramOf, surnameOf, tierOf } from '../lib/kit';
import { PLAYERS } from '../lib/data';

function find(name: string) {
  const player = PLAYERS.find((p) => p.name === name);
  if (!player) throw new Error(`fixture missing from dataset: ${name}`);
  return player;
}

describe('surnameOf', () => {
  test('keeps a plain surname', () => {
    expect(surnameOf('Diego Maradona')).toBe('Maradona');
  });

  test('keeps nobiliary particles attached', () => {
    expect(surnameOf('Virgil van Dijk')).toBe('van Dijk');
    expect(surnameOf('Angel Di Maria')).toBe('Di Maria');
    expect(surnameOf('Kevin De Bruyne')).toBe('De Bruyne');
    expect(surnameOf('Graeme Le Saux')).toBe('Le Saux');
    expect(surnameOf('Marc-Andre ter Stegen')).toBe('ter Stegen');
  });

  test('handles stacked particles', () => {
    expect(surnameOf('Edwin van der Sar')).toBe('van der Sar');
    expect(surnameOf('Micky van de Ven')).toBe('van de Ven');
    expect(surnameOf('Antonio de la Cruz')).toBe('de la Cruz');
  });

  test('leaves a one-word name alone', () => {
    expect(surnameOf('Ronaldinho')).toBe('Ronaldinho');
  });
});

describe('displayName', () => {
  test('shows the surname when it is unambiguous', () => {
    expect(displayName(find('Virgil van Dijk'))).toBe('van Dijk');
    expect(displayName(find('Paolo Maldini'))).toBe('Maldini');
  });

  // Four Silvas on four different cards, all reading "Silva", is unusable.
  test('adds an initial when two players share a surname', () => {
    expect(displayName(find('Thiago Silva'))).toBe('T. Silva');
    expect(displayName(find('Bernardo Silva'))).toBe('B. Silva');
    expect(displayName(find('David Silva'))).toBe('D. Silva');
  });

  test('falls back to the full name when the initial collides too', () => {
    expect(displayName(find('Dani Alves'))).toBe('Dani Alves');
    expect(displayName(find('Diego Alves'))).toBe('Diego Alves');
  });

  test('honours players known by something other than their surname', () => {
    expect(displayName(find('Julio Cesar da Silva'))).toBe('Julio Cesar');
    expect(displayName(find('Vinicius Junior'))).toBe('Vinicius Jr');
    expect(displayName(find('Roberto Carlos'))).toBe('Roberto Carlos');
  });

  test('never returns an empty label for anyone in the dataset', () => {
    for (const player of PLAYERS) {
      expect(displayName(player).trim().length).toBeGreaterThan(0);
    }
  });
});

describe('monogramOf', () => {
  test('initials a multi-word club', () => {
    expect(monogramOf('Real Madrid')).toBe('RM');
    expect(monogramOf('Manchester United')).toBe('MU');
  });

  test('takes three letters from a one-word club', () => {
    expect(monogramOf('Valencia')).toBe('VAL');
  });
});

describe('tierOf', () => {
  test('cuts tiers to this dataset', () => {
    expect(tierOf(91)).toBe('toty');
    expect(tierOf(86)).toBe('gold');
    expect(tierOf(82)).toBe('silver');
    expect(tierOf(74)).toBe('bronze');
  });
});
