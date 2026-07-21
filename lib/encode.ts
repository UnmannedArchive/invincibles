import type { RunState } from './run';
import { orderedXI } from './run';

export interface SharedRun {
  formationId: number;
  playerIds: number[]; // 11, in slot order
  seed: number; // u32
}

const VERSION = 1;
// version(1) + formation(1) + 11 * playerId(2) + seed(4)
const BYTE_LENGTH = 1 + 1 + 11 * 2 + 4;

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToBase64url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) out += B64[((b1 & 15) << 2) | (b2 >> 6)];
    if (i + 2 < bytes.length) out += B64[b2 & 63];
  }
  return out;
}

function base64urlToBytes(code: string): Uint8Array {
  const lookup = new Map<string, number>();
  for (let i = 0; i < B64.length; i++) lookup.set(B64[i], i);
  const bytes: number[] = [];
  for (let i = 0; i < code.length; i += 4) {
    const c0 = lookup.get(code[i]);
    const c1 = lookup.get(code[i + 1]);
    if (c0 === undefined || c1 === undefined) throw new Error('Invalid code');
    bytes.push((c0 << 2) | (c1 >> 4));
    if (i + 2 < code.length) {
      const c2 = lookup.get(code[i + 2]);
      if (c2 === undefined) throw new Error('Invalid code');
      bytes.push(((c1 & 15) << 4) | (c2 >> 2));
      if (i + 3 < code.length) {
        const c3 = lookup.get(code[i + 3]);
        if (c3 === undefined) throw new Error('Invalid code');
        bytes.push(((c2 & 3) << 6) | c3);
      }
    }
  }
  return Uint8Array.from(bytes);
}

export function encodeRun(shared: SharedRun): string {
  if (shared.playerIds.length !== 11) throw new Error('A run must have 11 players');
  const buf = new Uint8Array(BYTE_LENGTH);
  const view = new DataView(buf.buffer);
  view.setUint8(0, VERSION);
  view.setUint8(1, shared.formationId);
  shared.playerIds.forEach((id, i) => view.setUint16(2 + i * 2, id));
  view.setUint32(2 + 22, shared.seed >>> 0);
  return bytesToBase64url(buf);
}

export function decodeRun(code: string): SharedRun {
  if (!/^[A-Za-z0-9_-]+$/.test(code)) throw new Error('Invalid code');
  const bytes = base64urlToBytes(code);
  if (bytes.length !== BYTE_LENGTH) throw new Error('Wrong code length');
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint8(0) !== VERSION) throw new Error('Unsupported code version');
  const formationId = view.getUint8(1);
  const playerIds = Array.from({ length: 11 }, (_, i) => view.getUint16(2 + i * 2));
  const seed = view.getUint32(2 + 22);
  return { formationId, playerIds, seed };
}

export function sharedFromRun(run: RunState, seed: number): SharedRun {
  return {
    formationId: run.formationId,
    playerIds: orderedXI(run).map((p) => p.id),
    seed: seed >>> 0,
  };
}
