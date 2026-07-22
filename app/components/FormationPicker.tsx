"use client";

import { FORMATIONS } from "@/lib/formations";

const SHAPE_NOTE: Record<string, string> = {
  "4-3-3": "Wingers and width",
  "4-4-2": "Two up top, classic",
  "3-5-2": "Load the midfield",
};

export function FormationPicker({
  selected,
  onSelect,
}: {
  selected: number;
  onSelect: (id: number) => void;
}) {
  return (
    <div className="shapes">
      {FORMATIONS.map((f) => (
        <button
          key={f.id}
          onClick={() => onSelect(f.id)}
          aria-pressed={f.id === selected}
          className="shape"
        >
          <span className="n">{f.name}</span>
          <span className="note">{SHAPE_NOTE[f.name]}</span>
        </button>
      ))}
    </div>
  );
}
