import type { Formation, Pos } from './types';

function line(pos: Pos, x: number, ys: number[]) {
  return ys.map((y) => ({ pos, x, y }));
}

export const FORMATIONS: Formation[] = [
  {
    id: 0,
    name: '4-3-3',
    slots: [
      { pos: 'GK', x: 6, y: 50 },
      ...line('DF', 26, [15, 38, 62, 85]),
      ...line('MF', 52, [25, 50, 75]),
      ...line('FW', 80, [20, 50, 80]),
    ],
  },
  {
    id: 1,
    name: '4-4-2',
    slots: [
      { pos: 'GK', x: 6, y: 50 },
      ...line('DF', 26, [15, 38, 62, 85]),
      ...line('MF', 54, [15, 38, 62, 85]),
      ...line('FW', 82, [35, 65]),
    ],
  },
  {
    id: 2,
    name: '3-5-2',
    slots: [
      { pos: 'GK', x: 6, y: 50 },
      ...line('DF', 26, [25, 50, 75]),
      ...line('MF', 54, [10, 30, 50, 70, 90]),
      ...line('FW', 82, [35, 65]),
    ],
  },
];

export function getFormation(id: number): Formation {
  const f = FORMATIONS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown formation id: ${id}`);
  return f;
}
