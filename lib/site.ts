/**
 * Where this deployment thinks it lives. Share cards are absolute URLs, so
 * getting this wrong means links unfurl as nothing.
 *
 * Set NEXT_PUBLIC_SITE_URL once there's a real domain. Until then Vercel's
 * production domain is right and, unlike VERCEL_URL, stable across deploys —
 * a card pointing at a per-deployment hostname rots as soon as the next push
 * lands.
 */
export function siteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : '');

  if (!configured) return 'http://localhost:3000';

  const withScheme = /^https?:\/\//.test(configured) ? configured : `https://${configured}`;
  return withScheme.replace(/\/+$/, '');
}
