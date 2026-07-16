import type { Player, Pos } from './types';
import englandA from '../data/players/england-a.json';
import englandB from '../data/players/england-b.json';
import englandC from '../data/players/england-c.json';
import englandD from '../data/players/england-d.json';
import spainA from '../data/players/spain-a.json';
import spainB from '../data/players/spain-b.json';

interface RawPlayer {
  name: string;
  pos: string;
  rating: number;
  club: string;
  decade: string;
}

// Ids are `base + index within file`, so they stay stable as long as files are
// append-only (see data/players/README.md). Never reorder this manifest or the
// arrays inside the files: share links encode these ids.
const FILES: Array<[RawPlayer[], number]> = [
  [englandA, 0],
  [englandB, 500],
  [englandC, 1000],
  [englandD, 1500],
  [spainA, 2000],
  [spainB, 2500],
];

export const PLAYERS: Player[] = FILES.flatMap(([players, base]) =>
  players.map((p, i) => ({ ...p, pos: p.pos as Pos, id: base + i })),
);

const byId = new Map(PLAYERS.map((p) => [p.id, p]));

export interface PoolKey {
  club: string;
  decade: string;
}

const pools = new Map<string, Player[]>();
for (const p of PLAYERS) {
  const key = `${p.club}|${p.decade}`;
  if (!pools.has(key)) pools.set(key, []);
  pools.get(key)!.push(p);
}

export const POOL_KEYS: PoolKey[] = [...pools.keys()].map((k) => {
  const [club, decade] = k.split('|');
  return { club, decade };
});

export function getPool(club: string, decade: string): Player[] {
  return pools.get(`${club}|${decade}`) ?? [];
}

export function playerById(id: number): Player | undefined {
  return byId.get(id);
}
