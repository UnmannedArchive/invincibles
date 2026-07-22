import { getFormation } from "@/lib/formations";
import { playerById } from "@/lib/data";
import { MiniCard } from "./PlayerCard";
import type { RunState } from "@/lib/run";

function PitchLines() {
  return (
    <svg
      className="pitch-lines"
      viewBox="0 0 68 105"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g fill="none" stroke="rgba(120, 210, 255, 0.32)" strokeWidth="0.4">
        <line x1="0" y1="52.5" x2="68" y2="52.5" />
        <circle cx="34" cy="52.5" r="9.15" />
        <circle cx="34" cy="52.5" r="0.6" fill="rgba(120, 210, 255, 0.32)" />
        {/* top penalty + goal areas */}
        <rect x="13.85" y="0" width="40.3" height="16.5" />
        <rect x="24.85" y="0" width="18.3" height="5.5" />
        {/* bottom penalty + goal areas */}
        <rect x="13.85" y="88.5" width="40.3" height="16.5" />
        <rect x="24.85" y="99.5" width="18.3" height="5.5" />
      </g>
    </svg>
  );
}

export function Pitch({ run }: { run: RunState }) {
  const formation = getFormation(run.formationId);
  return (
    <div className="pitch" role="img" aria-label="Your XI on the pitch">
      <PitchLines />
      {formation.slots.map((slot, i) => {
        const id = run.picks[i];
        const player = id === null ? null : playerById(id);
        // portrait pitch: attack (high x) sits near the top
        return (
          <div
            key={i}
            className={player ? "slot" : "slot slot-empty"}
            style={{ top: `${100 - slot.x}%`, left: `${slot.y}%` }}
          >
            {player ? (
              <MiniCard player={player} position={slot.label} />
            ) : (
              <div className="empty-card">{slot.label}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
