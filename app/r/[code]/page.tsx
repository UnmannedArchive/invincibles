import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { replayFromCode } from "@/lib/replay";
import type { Tier } from "@/lib/types";
import { ResultView } from "@/app/components/ResultView";

type Params = { params: Promise<{ code: string }> };

// A season is a pure function of its code, so a given URL only ever needs
// rendering once. Unknown codes are still generated on demand (dynamicParams
// defaults to true) and then cached alongside the rest.
export const dynamic = "force-static";

const TIER_TITLE: Record<Tier, string> = {
  perfect: "a PERFECT 38-0-0",
  invincible: "an INVINCIBLE season",
  champions: "the title",
  none: "a season",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const replay = replayFromCode(code);
  if (!replay) return { title: "Invincibles" };

  const { result } = replay;
  const title = `Invincibles — ${TIER_TITLE[result.tier]} (${result.wins}W ${result.draws}D ${result.losses}L)`;
  const description = `${result.wins} wins, ${result.draws} draws, ${result.losses} losses across 38 games. Think you can do better?`;
  const image = `/api/og?code=${encodeURIComponent(code)}`;

  return {
    title,
    description,
    alternates: { canonical: `/r/${code}` },
    openGraph: {
      title,
      description,
      url: `/r/${code}`,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedRunPage({ params }: Params) {
  const { code } = await params;
  const replay = replayFromCode(code);
  if (!replay) notFound();

  const { run, result } = replay;
  return (
    <main className="shell">
      <header>
        <div className="eyebrow">A shared season</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(2.4rem, 13.5vw, 3.8rem)" }}
        >
          Invinci<span className="go">bles</span>
        </h1>
      </header>
      <section style={{ marginTop: 18 }}>
        <ResultView
          run={run}
          result={result}
          actions={
            <Link className="btn" href="/" style={{ textAlign: "center" }}>
              Draft your own XI
            </Link>
          }
        />
      </section>
    </main>
  );
}
