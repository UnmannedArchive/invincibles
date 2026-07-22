"use client";

import type { Manager, Touchline } from "@/lib/managers";
import { surnameOf } from "@/lib/kit";

const STYLE_LABEL: Record<Touchline, string> = {
  attacking: "Attacking",
  balanced: "Balanced",
  defensive: "Defensive",
};

export function ManagerPicker({
  managers,
  onPick,
}: {
  managers: Manager[];
  onPick: (manager: Manager) => void;
}) {
  return (
    <div className="gaffer-grid">
      {managers.map((manager) => (
        <button
          key={manager.id}
          className={`gaffer gaffer-${manager.style}`}
          onClick={() => onPick(manager)}
          aria-label={`Appoint ${manager.name}, ${STYLE_LABEL[manager.style]}`}
        >
          <span className="gaffer-top">
            <span className="gaffer-rating">{manager.rating}</span>
            <span className="gaffer-style">{STYLE_LABEL[manager.style]}</span>
          </span>
          <span className="gaffer-name">{surnameOf(manager.name)}</span>
          <span className="gaffer-club">
            {manager.club} · {manager.era}
          </span>
          <span className="gaffer-bonus">
            <span>+{manager.attack} ATT</span>
            <span>+{manager.defense} DEF</span>
          </span>
        </button>
      ))}
    </div>
  );
}
