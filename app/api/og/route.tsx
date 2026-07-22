import { ImageResponse } from "next/og";
import { replayFromCode } from "@/lib/replay";
import { getFormation } from "@/lib/formations";
import { displayName, tierOf, type CardTier } from "@/lib/kit";
import type { Player, Tier } from "@/lib/types";

export const runtime = "nodejs";
// Same code, same card, forever — so let the CDN keep it.
const CACHE_A_YEAR = "public, max-age=31536000, s-maxage=31536000, immutable";

export const alt = "An Invincibles season result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIER_LABEL: Record<Tier, string> = {
  perfect: "PERFECT",
  invincible: "INVINCIBLE",
  champions: "CHAMPIONS",
  none: "BEATEN",
};

// next/og has no CSS variables, so the palette is repeated here by hand.
const INK = "#eef4ff";
const DIM = "#8ea3c4";
const CARD_COLOR: Record<CardTier, string> = {
  toty: "#f0cf7d",
  gold: "#f3c55a",
  silver: "#c9d4e2",
  bronze: "#cd8b53",
};

function tierColor(tier: Tier): string {
  return tier === "none" ? DIM : tier === "champions" ? INK : "#12e5ff";
}

function ordinal(n: number): string {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (suffix[(v - 20) % 10] || suffix[v] || suffix[0]);
}

function MiniCard({ player, position }: { player: Player; position: string }) {
  const color = CARD_COLOR[tierOf(player.rating)];
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: 96,
        height: 126,
        borderRadius: 6,
        border: `2px solid ${color}`,
        background: "linear-gradient(160deg, #16223f 0%, #070c18 70%)",
        padding: "8px 6px 6px 8px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color }}>{player.rating}</span>
        <span style={{ fontSize: 15, color, letterSpacing: 1 }}>{position}</span>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          borderTop: `1px solid ${color}`,
          paddingTop: 5,
          fontSize: 15,
          color: INK,
        }}
      >
        {displayName(player).slice(0, 13)}
      </div>
    </div>
  );
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  const replay = replayFromCode(code);
  let body;

  if (replay) {
    const { xi, run, result } = replay;
    const formation = getFormation(run.formationId);

    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(150deg, #0b1428 0%, #05070e 100%)",
          backgroundColor: "#05070e",
          padding: "48px 56px",
          color: INK,
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            letterSpacing: 9,
            fontSize: 28,
            color: "#12e5ff",
          }}
        >
          <span>I N V I N C I B L E S</span>
          <span style={{ color: DIM, letterSpacing: 3 }}>{formation.name}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", marginTop: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 124,
              fontWeight: 800,
              color: tierColor(result.tier),
              lineHeight: 1,
            }}
          >
            {TIER_LABEL[result.tier]}
          </div>
          <div style={{ display: "flex", fontSize: 44, marginTop: 14 }}>
            {result.wins}W · {result.draws}D · {result.losses}L · {result.points} pts ·{" "}
            {result.goalsFor}–{result.goalsAgainst}
          </div>
          <div style={{ display: "flex", fontSize: 28, marginTop: 8, color: DIM }}>
            Finished {ordinal(result.position)} of 20
            {replay.manager ? ` · managed by ${replay.manager.name}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
          {xi.map((player, i) => (
            <MiniCard key={player.id} player={player} position={formation.slots[i].label} />
          ))}
        </div>
      </div>
    );
  } else {
    // Unreadable code: still unfurl as the game rather than a broken image.
    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#05070e",
          color: "#12e5ff",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: 8,
          fontFamily: "sans-serif",
        }}
      >
        INVINCIBLES
      </div>
    );
  }

  return new ImageResponse(body, {
    ...size,
    headers: { "Cache-Control": CACHE_A_YEAR },
  });
}
