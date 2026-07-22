import { decodeRun } from './encode';
import { playerById } from './data';
import { getFormation } from './formations';
import { orderedXI, type RunState } from './run';
import { seasonSeed } from './seed';
import { simulateSeason } from './sim';
import type { Player, SeasonResult } from './types';

export interface Replay {
  run: RunState;
  xi: Player[];
  result: SeasonResult;
}

/** The one place that decides which season an XI gets. */
export function playRun(run: RunState): SeasonResult {
  const xi = orderedXI(run);
  return simulateSeason(
    xi,
    run.formationId,
    seasonSeed(
      run.formationId,
      xi.map((p) => p.id),
    ),
  );
}

/**
 * Rebuild a run from a share code, or null if the code is unreadable — bad
 * base64, an unknown player, an XI that doesn't fit the formation it claims.
 * Callers render their own fallback; nothing here should ever throw at a
 * visitor who mistyped a URL.
 */
export function replayFromCode(code: string): Replay | null {
  try {
    const shared = decodeRun(code);
    getFormation(shared.formationId); // throws on an unknown formation id
    const xi = shared.playerIds.map((id) => {
      const player = playerById(id);
      if (!player) throw new Error(`unknown player ${id}`);
      return player;
    });
    const run: RunState = { formationId: shared.formationId, picks: shared.playerIds };
    return { run, xi, result: playRun(run) };
  } catch {
    return null;
  }
}
