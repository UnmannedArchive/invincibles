import type { ReactNode } from "react";
import type { SeasonResult, TableRow, Tier } from "@/lib/types";
import type { RunState } from "@/lib/run";
import { getFormation } from "@/lib/formations";
import { managerById } from "@/lib/managers";
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

/** Top of the table, and your own row whether or not it made the cut. */
function FinalTable({ table }: { table: TableRow[] }) {
  const yourIndex = table.findIndex((row) => row.isYou);
  const shown: (TableRow | null)[] =
    yourIndex < 6
      ? table.slice(0, 6)
      : [...table.slice(0, 5), null, table[yourIndex]];

  return (
    <div className="league">
      <div className="league-row league-head">
        <span>Pos</span>
        <span>Club</span>
        <span>GD</span>
        <span>Pts</span>
      </div>
      {shown.map((row, i) =>
        row === null ? (
          <div key="gap" className="league-gap">
            ⋯
          </div>
        ) : (
          <div
            key={row.name + i}
            className={row.isYou ? "league-row you" : "league-row"}
          >
            <span className="data">{table.indexOf(row) + 1}</span>
            <span className="club">{row.name}</span>
            <span className="data">
              {row.goalDiff >= 0 ? "+" : ""}
              {row.goalDiff}
            </span>
            <span className="data pts">{row.points}</span>
          </div>
        ),
      )}
    </div>
  );
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
  const manager = run.managerId === null ? null : managerById(run.managerId);
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
        {manager && (
          <div className="dugout">
            <span>
              Managed by <b>{manager.name}</b>
            </span>
            <span className="dugout-bonus">
              +{manager.attack} att · +{manager.defense} def
            </span>
          </div>
        )}
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

      <FinalTable table={result.table} />

      <Pitch run={run} />

      {actions}
    </div>
  );
}
