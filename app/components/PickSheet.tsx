"use client";

import { useEffect, useRef } from "react";
import { PlayerCard } from "./PlayerCard";
import type { Player } from "@/lib/types";

export function PickSheet({
  club,
  decade,
  position,
  eligible,
  onPick,
  onClose,
}: {
  club: string;
  decade: string;
  position: string;
  eligible: Player[];
  onPick: (player: Player) => void;
  onClose: () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Everyone offered can play the one slot being filled, so there is nothing
  // to group by — just the best candidates this club and era can give you.
  const candidates = [...eligible].sort((a, b) => b.rating - a.rating);

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
          <div className="eyebrow">
            {decade} · pick your {position}
          </div>
          <div className="display" style={{ fontSize: "1.9rem", marginTop: 4 }}>
            {club}
          </div>
        </div>
        <div className="sheet-scroll">
          <div className="pos-heading">
            {candidates.length} available for {position}
          </div>
          <div className="card-grid">
            {candidates.map((p) => (
              <PlayerCard key={p.id} player={p} position={position} onPick={onPick} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
