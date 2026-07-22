import type { Formation, Pos } from './types';

/**
 * A line of the team. `pos` is the group the sim reasons about; `label` is the
 * position a player would actually name — a back four is a left-back, two
 * centre-halves and a right-back, not four DFs. Slots run left to right
 * (y = 0 is the left touchline), so the labels have to as well.
 */
function line(pos: Pos, x: number, players: [number, string][]) {
  return players.map(([y, label]) => ({ pos, label, x, y }));
}

export const FORMATIONS: Formation[] = [
  {
    id: 0,
    name: '4-3-3',
    slots: [
      { pos: 'GK', label: 'GK', x: 6, y: 50 },
      ...line('DF', 26, [
        [15, 'LB'],
        [38, 'CB'],
        [62, 'CB'],
        [85, 'RB'],
      ]),
      ...line('MF', 52, [
        [25, 'CM'],
        [50, 'CM'],
        [75, 'CM'],
      ]),
      ...line('FW', 80, [
        [20, 'LW'],
        [50, 'ST'],
        [80, 'RW'],
      ]),
    ],
  },
  {
    id: 1,
    name: '4-4-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 6, y: 50 },
      ...line('DF', 26, [
        [15, 'LB'],
        [38, 'CB'],
        [62, 'CB'],
        [85, 'RB'],
      ]),
      ...line('MF', 54, [
        [15, 'LM'],
        [38, 'CM'],
        [62, 'CM'],
        [85, 'RM'],
      ]),
      ...line('FW', 82, [
        [35, 'ST'],
        [65, 'ST'],
      ]),
    ],
  },
  {
    id: 2,
    name: '3-5-2',
    slots: [
      { pos: 'GK', label: 'GK', x: 6, y: 50 },
      ...line('DF', 26, [
        [25, 'CB'],
        [50, 'CB'],
        [75, 'CB'],
      ]),
      ...line('MF', 54, [
        [10, 'LM'],
        [30, 'CM'],
        [50, 'CDM'],
        [70, 'CM'],
        [90, 'RM'],
      ]),
      ...line('FW', 82, [
        [35, 'ST'],
        [65, 'ST'],
      ]),
    ],
  },
];

export function getFormation(id: number): Formation {
  const f = FORMATIONS.find((x) => x.id === id);
  if (!f) throw new Error(`Unknown formation id: ${id}`);
  return f;
}
