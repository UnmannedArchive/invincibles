import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseEntries, buildLeaguePath, standings, type Standing } from "@/lib/league";
import { LeagueActions } from "@/app/components/LeagueActions";
import type { Tier } from "@/lib/types";

type Params = { params: Promise<{ entries: string[] }> };

// A league is a pure function of the codes in its URL, so it renders once and
// caches — unknown ones are generated on demand, same as a shared season.
export const dynamic = "force-static";

const ACHIEVEMENT: Partial<Record<Tier, string>> = {
  perfect: "Perfect",
  invincible: "Invincible",
  champions: "Champions",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { entries } = await params;
  const league = standings(parseEntries(entries));
  if (league.size === 0) return { title: "Invincibles — league" };

  const leader = league.standings[0];
  const title = `Invincibles — a ${league.size}-manager league`;
  const description = `${leader.handle} leads on ${leader.points} pts. Draft an XI and see where you finish.`;
  const image = `/api/og?code=${encodeURIComponent(leader.code)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function LeaguePage({ params }: Params) {
  const { entries } = await params;
  const league = standings(parseEntries(entries));
  if (league.size === 0) notFound();

  // Rebuild the path from valid entries only, so a rotted code doesn't ride
  // along into everyone's next link.
  const path = buildLeaguePath(
    league.standings.map((s) => ({ handle: s.handle, code: s.code })),
  );

  return (
    <main className="shell">
      <header>
        <h1
          className="wordmark wordmark-ink"
          style={{ fontSize: "clamp(1.9rem, 9vw, 2.6rem)", marginBottom: 4 }}
        >
          Invinci<span className="go">bles</span>
        </h1>
        <div className="eyebrow">
          The league · {league.size} {league.size === 1 ? "manager" : "managers"}
        </div>
      </header>

      <section style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <div className="standings">
          <div className="standings-row standings-head">
            <span>#</span>
            <span>Manager</span>
            <span>GD</span>
            <span>Pts</span>
          </div>
          {league.standings.map((s) => (
            <StandingRow key={s.code} s={s} leader={s.rank === 1} />
          ))}
        </div>

        {league.size > 1 && (
          <div className="supers">
            {league.bestAttack && (
              <div className="super">
                <span className="super-k">Best attack</span>
                <span className="super-v">
                  {league.bestAttack.handle} · {league.bestAttack.goalsFor} GF
                </span>
              </div>
            )}
            {league.bestDefense && (
              <div className="super">
                <span className="super-k">Meanest defence</span>
                <span className="super-v">
                  {league.bestDefense.handle} · {league.bestDefense.goalsAgainst} GA
                </span>
              </div>
            )}
          </div>
        )}

        {league.unreadable > 0 && (
          <p className="tile-body" style={{ textAlign: "center" }}>
            {league.unreadable} {league.unreadable === 1 ? "entry" : "entries"} couldn&rsquo;t be
            read and {league.unreadable === 1 ? "was" : "were"} left out.
          </p>
        )}

        <LeagueActions path={path} />
      </section>
    </main>
  );
}

function StandingRow({ s, leader }: { s: Standing; leader: boolean }) {
  const badge = ACHIEVEMENT[s.tier];
  return (
    <Link
      href={`/r/${s.code}`}
      className={leader ? "standings-row leader" : "standings-row"}
    >
      <span className="data rank">{s.rank}</span>
      <span className="who">
        <span className="name">
          {s.handle}
          {badge && <span className="ach">{badge}</span>}
        </span>
        <span className="rec">
          {s.wins}W {s.draws}D {s.losses}L · {s.goalsFor}–{s.goalsAgainst}
        </span>
      </span>
      <span className="data gd">
        {s.goalDiff >= 0 ? "+" : ""}
        {s.goalDiff}
      </span>
      <span className="data pts">{s.points}</span>
    </Link>
  );
}
