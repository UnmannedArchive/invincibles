import type { Metadata } from "next";
import Link from "next/link";
import { decodeRun } from "@/lib/encode";
import { playerById } from "@/lib/data";
import { simulateSeason } from "@/lib/sim";
import { getFormation } from "@/lib/formations";
import type { RunState } from "@/lib/run";
import type { SeasonResult, Tier } from "@/lib/types";
import { ResultView } from "@/app/components/ResultView";

type Params = { params: Promise<{ code: string }> };

const TIER_TITLE: Record<Tier, string> = {
  perfect: "a PERFECT 38-0-0",
  invincible: "an INVINCIBLE season",
  champions: "the title",
  none: "a season",
};

// Rebuild a run + season from a share code, or null if the code is unreadable.
function decodeSeason(
  code: string,
): { run: RunState; result: SeasonResult } | null {
  try {
    const shared = decodeRun(code);
    getFormation(shared.formationId); // throws on bad formation id
    const xi = shared.playerIds.map((id) => {
      const p = playerById(id);
      if (!p) throw new Error("unknown player");
      return p;
    });
    const run: RunState = {
      formationId: shared.formationId,
      picks: shared.playerIds,
    };
    const result = simulateSeason(xi, shared.formationId, shared.seed);
    return { run, result };
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { code } = await params;
  const decoded = decodeSeason(code);
  if (!decoded) {
    return { title: "Invincibles" };
  }
  const { result } = decoded;
  const title = `Invincibles — ${TIER_TITLE[result.tier]} (${result.wins}W ${result.draws}D ${result.losses}L)`;
  const image = `/api/og?code=${encodeURIComponent(code)}`;
  return {
    title,
    openGraph: {
      title,
      description: `${result.wins} wins, ${result.draws} draws, ${result.losses} losses across 38 games. Think you can do better?`,
      images: [{ url: image, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", images: [image] },
  };
}

export default async function SharedRunPage({ params }: Params) {
  const { code } = await params;
  const decoded = decodeSeason(code);

  if (!decoded) {
    return (
      <main className="shell" style={{ justifyContent: "center", gap: 16 }}>
        <h1 className="wordmark" style={{ fontSize: "3rem" }}>
          Invinci<span className="go">bles</span>
        </h1>
        <p style={{ color: "var(--chalk-dim)" }}>
          This season link couldn&rsquo;t be read. It may be from a newer
          version of the game.
        </p>
        <Link className="btn" href="/" style={{ textAlign: "center" }}>
          Draft your own
        </Link>
      </main>
    );
  }

  const { run, result } = decoded;
  return (
    <main className="shell">
      <header>
        <div className="eyebrow">A shared season</div>
        <h1
          className="wordmark"
          style={{ fontSize: "clamp(2.6rem, 15vw, 4rem)" }}
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
