import type { ReactNode } from "react";
import type { SeasonResult, Tier } from "@/lib/types";
import type { RunState } from "@/lib/run";
import { getFormation } from "@/lib/formations";
import { Pitch } from "./Pitch";

const TIER_LABEL: Record<Tier, string> = {
  perfect: "Perfect",
  invincible: "Invincible",
  champions: "Champions",
  none: "Beaten",
};

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function blurb(result: SeasonResult): string {
  switch (result.tier) {
    case "perfect":
      return "38 played, 38 won. The season that cannot happen, happened.";
    case "invincible":
      return "Champions, and not beaten once all season.";
    case "champions":
      return "Top of the table — but they lost along the way.";
    default:
      return `Finished ${ordinal(result.position)}. Next time.`;
  }
}

export function ResultView({
  run,
  result,
  actions,
}: {
  run: RunState;
  result: SeasonResult;
  actions?: ReactNode;
}) {
  const formation = getFormation(run.formationId);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="verdict">
        <div className="eyebrow">Final standing · {formation.name}</div>
        <div className={`tier tier-${result.tier}`}>
          {TIER_LABEL[result.tier]}
        </div>
        <div className="record-line">
          {result.wins}W · {result.draws}D · {result.losses}L ·{" "}
          {result.points} pts
        </div>
        <p
          style={{
            color: "var(--chalk-dim)",
            fontSize: "0.9rem",
            marginTop: 8,
            maxWidth: 340,
            marginInline: "auto",
          }}
        >
          {blurb(result)}
        </p>
      </div>

      <div className="tally">
        <div className="cell">
          <div className="k">POS</div>
          <div className="v">{result.position}</div>
        </div>
        <div className="cell">
          <div className="k">GF</div>
          <div className="v">{result.goalsFor}</div>
        </div>
        <div className="cell">
          <div className="k">GA</div>
          <div className="v">{result.goalsAgainst}</div>
        </div>
        <div className="cell">
          <div className="k">GD</div>
          <div className="v">
            {result.goalsFor - result.goalsAgainst >= 0 ? "+" : ""}
            {result.goalsFor - result.goalsAgainst}
          </div>
        </div>
      </div>

      <Pitch run={run} />

      {actions}
    </div>
  );
}
