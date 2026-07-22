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
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}
    >
      {FORMATIONS.map((f) => {
        const active = f.id === selected;
        return (
          <button
            key={f.id}
            onClick={() => onSelect(f.id)}
            aria-pressed={active}
            className="card"
            style={{
              padding: "14px 8px",
              cursor: "pointer",
              borderColor: active ? "var(--gold)" : "var(--line)",
              background: active ? "var(--gold-soft)" : "var(--panel)",
              textAlign: "center",
            }}
          >
            <div
              className="display"
              style={{ fontSize: "1.5rem", color: "var(--chalk)" }}
            >
              {f.name}
            </div>
            <div
              style={{
                fontSize: "0.62rem",
                color: "var(--chalk-dim)",
                marginTop: 4,
                lineHeight: 1.2,
              }}
            >
              {SHAPE_NOTE[f.name]}
            </div>
          </button>
        );
      })}
    </div>
  );
}
