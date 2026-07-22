"use client";

import { useEffect, useRef } from "react";
import { PlayerCard } from "./PlayerCard";
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
  const sheetRef = useRef<HTMLDivElement>(null);

  const groups = POS_ORDER.map((pos) => ({
    pos,
    players: eligible
      .filter((p) => p.pos === pos)
      .sort((a, b) => b.rating - a.rating),
  })).filter((g) => g.players.length > 0);

  // It's a modal: escape closes it, and the tab loop stays inside it.
  useEffect(() => {
    const cards = () =>
      Array.from(sheetRef.current?.querySelectorAll<HTMLElement>("button") ?? []);
    cards()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = cards();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="sheet-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Pick a player from ${club} ${decade}`}
    >
      <div className="sheet" ref={sheetRef} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <div className="eyebrow">{decade} · pick one for an open slot</div>
          <div className="display" style={{ fontSize: "1.9rem", marginTop: 4 }}>
            {club}
          </div>
        </div>
        <div className="sheet-scroll">
          {groups.map((g) => (
            <div key={g.pos}>
              <div className="pos-heading">{POS_LABEL[g.pos]}</div>
              <div className="card-grid">
                {g.players.map((p) => (
                  <PlayerCard key={p.id} player={p} onPick={onPick} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
