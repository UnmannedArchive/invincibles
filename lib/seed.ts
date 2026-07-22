/**
 * The season seed is derived from the XI itself rather than chosen at play
 * time. Two consequences, both deliberate:
 *
 *  - A given XI always plays the same season. There is no re-roll, and a share
 *    link cannot carry a hand-picked seed, so results can't be fished for.
 *  - Which slot a player landed in is cosmetic (all four defenders are the same
 *    line), so the ids are sorted before hashing. Otherwise you could permute
 *    equivalent players between slots and quietly get 800-odd seasons to
 *    choose from off the same XI.
 */
export function seasonSeed(
  formationId: number,
  playerIds: number[],
  managerId: number | null = null,
): number {
  const ids = [...playerIds].sort((a, b) => a - b);
  // FNV-1a, 32-bit.
  let hash = 0x811c9dc5;
  const mix = (byte: number) => {
    hash ^= byte & 0xff;
    hash = Math.imul(hash, 0x01000193);
  };
  mix(formationId);
  for (const id of ids) {
    mix(id >>> 8);
    mix(id);
  }
  // The dugout is part of the team, so it's part of the season.
  const manager = managerId ?? 0;
  mix(manager >>> 8);
  mix(manager);
  return hash >>> 0;
}
