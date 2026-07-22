import { ImageResponse } from "next/og";
import { decodeRun } from "@/lib/encode";
import { playerById } from "@/lib/data";
import { simulateSeason } from "@/lib/sim";
import { getFormation } from "@/lib/formations";
import { shirtNumber, surnameOf } from "@/app/components/KitToken";
import type { Tier } from "@/lib/types";

export const runtime = "nodejs";
export const alt = "An Invincibles season result";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TIER_LABEL: Record<Tier, string> = {
  perfect: "PERFECT",
  invincible: "INVINCIBLE",
  champions: "CHAMPIONS",
  none: "BEATEN",
};

function tierColor(tier: Tier): string {
  return tier === "none" ? "#9db0a2" : tier === "champions" ? "#eef2ea" : "#e6b24c";
}

export async function GET(req: Request) {
  const code = new URL(req.url).searchParams.get("code") ?? "";
  let body;

  try {
    const shared = decodeRun(code);
    const formation = getFormation(shared.formationId);
    const xi = shared.playerIds.map((id) => {
      const p = playerById(id);
      if (!p) throw new Error("unknown player");
      return p;
    });
    const result = simulateSeason(xi, shared.formationId, shared.seed);
    const color = tierColor(result.tier);

    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0c1712",
          padding: "56px 64px",
          color: "#eef2ea",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            letterSpacing: 8,
            fontSize: 30,
            color: "#9db0a2",
          }}
        >
          <span>I N V I N C I B L E S</span>
          <span>{formation.name}</span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 30,
          }}
        >
          <div style={{ display: "flex", fontSize: 132, fontWeight: 800, color, lineHeight: 1 }}>
            {TIER_LABEL[result.tier]}
          </div>
          <div style={{ display: "flex", fontSize: 46, marginTop: 12, color: "#eef2ea" }}>
            {result.wins}W · {result.draws}D · {result.losses}L · {result.points} pts ·{" "}
            {result.goalsFor}–{result.goalsAgainst}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            marginTop: "auto",
          }}
        >
          {xi.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#16291f",
                border: "1px solid #294b39",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 26,
              }}
            >
              <span style={{ color: "#e6b24c", fontWeight: 700 }}>
                {shirtNumber(i)}
              </span>
              <span>{surnameOf(p.name)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  } catch {
    body = (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0c1712",
          color: "#e6b24c",
          fontSize: 72,
          fontWeight: 800,
          letterSpacing: 6,
          fontFamily: "sans-serif",
        }}
      >
        INVINCIBLES
      </div>
    );
  }

  return new ImageResponse(body, size);
}
