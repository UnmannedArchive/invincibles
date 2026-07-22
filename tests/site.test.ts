import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { siteUrl } from '../lib/site';

const KEYS = ['NEXT_PUBLIC_SITE_URL', 'VERCEL_PROJECT_PRODUCTION_URL'] as const;
let saved: Record<string, string | undefined> = {};

beforeEach(() => {
  saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe('siteUrl', () => {
  test('falls back to localhost for local development', () => {
    expect(siteUrl()).toBe('http://localhost:3000');
  });

  test('uses the project production domain on Vercel', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'invincibles.vercel.app';
    expect(siteUrl()).toBe('https://invincibles.vercel.app');
  });

  test('prefers an explicitly configured site url', () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = 'invincibles.vercel.app';
    process.env.NEXT_PUBLIC_SITE_URL = 'https://invincibles.football';
    expect(siteUrl()).toBe('https://invincibles.football');
  });

  test('tolerates a bare domain and a trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'invincibles.football/';
    expect(siteUrl()).toBe('https://invincibles.football');
  });

  // Share cards resolve against this, so it must always parse as a URL.
  test('always returns something new URL() accepts', () => {
    expect(() => new URL(siteUrl())).not.toThrow();
    process.env.NEXT_PUBLIC_SITE_URL = 'https://invincibles.football';
    expect(() => new URL(siteUrl())).not.toThrow();
  });
});
