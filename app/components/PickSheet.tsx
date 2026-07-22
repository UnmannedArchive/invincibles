"use client";

import type { Player, Pos } from "@/lib/types";

const POS_ORDER: Pos[] = ["GK", "DF", "MF", "FW"];
const POS_LABEL: Record<Pos, string> = {
  GK: "Goalkeepers",
  DF: "Defenders",
  MF: "Midfielders",
  FW: "Forwards",
};

export function PickSheet({
  club,
  decade,
  eligible,
  onPick,
  onClose,
}: {
  club: string;
  decade: string;
  eligible: Player[];
  onPick: (player: Player) => void;
  onClose: () => void;
}) {
  const groups = POS_ORDER.map((pos) => ({
    pos,
    players: eligible
      .filter((p) => p.pos === pos)
      .sort((a, b) => b.rating - a.rating),
  })).filter((g) => g.players.length > 0);

  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pick a player from ${club} ${decade}`}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="eyebrow">{decade} · pick one for an open slot</div>
          <div
            className="display"
            style={{ fontSize: "1.9rem", marginTop: 4 }}
          >
            {club}
          </div>
        </div>
        <div className="sheet-scroll">
          {groups.map((g) => (
            <div key={g.pos} className="pos-group">
              <div className="pos-heading">{POS_LABEL[g.pos]}</div>
              {g.players.map((p) => (
                <button
                  key={p.id}
                  className="player-row"
                  onClick={() => onPick(p)}
                >
                  <div>
                    <div className="pname">{p.name}</div>
                    <div className="pmeta">{p.pos}</div>
                  </div>
                  <div className="prating">{p.rating}</div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
