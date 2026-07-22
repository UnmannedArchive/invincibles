"use client";

import { useCallback, useMemo, useState } from "react";
import { getFormation } from "@/lib/formations";
import { getPool, type PoolKey } from "@/lib/data";
import {
  newRun,
  eligibleForSlot,
  applyPick,
  setManager,
  nextOpenSlot,
  isComplete,
  spinPool,
  type RunState,
} from "@/lib/run";
import { managerShortlist, type Manager } from "@/lib/managers";
import { playRun } from "@/lib/replay";
import { sharedFromRun, encodeRun } from "@/lib/encode";
import { shareText } from "@/lib/share";
import { mulberry32 } from "@/lib/rng";
import type { Player, SeasonResult } from "@/lib/types";
import { FormationPicker } from "./components/FormationPicker";
import { SplitFlap } from "./components/SplitFlap";
import { Pitch } from "./components/Pitch";
import { PickSheet } from "./components/PickSheet";
import { Vidiprinter } from "./components/Vidiprinter";
import { ResultView } from "./components/ResultView";
import { ManagerPicker } from "./components/ManagerPicker";

// What the slot being drafted actually asks for, in a player's words.
const POSITION_NOTE: Record<string, string> = {
  GK: "Last line — shot-stopper",
  LB: "Left back, overlaps the wing",
  RB: "Right back, overlaps the wing",
  CB: "Centre half — head it, win it",
  CDM: "Sits in front of the back line",
  CM: "Runs the middle of the park",
  LM: "Left of midfield",
  RM: "Right of midfield",
  LW: "Left wing — beat your man",
  RW: "Right wing — beat your man",
  ST: "Up top. Put it away",
};

type Phase = "setup" | "drafting" | "manager" | "reveal" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [formationId, setFormationId] = useState(0);
  const [run, setRun] = useState<RunState>(() => newRun(0));
  const [spinKey, setSpinKey] = useState(0);
  const [spin, setSpin] = useState<PoolKey | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [shortlist, setShortlist] = useState<Manager[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const drafted = run.picks.filter((p) => p !== null).length;
  const slotIndex = nextOpenSlot(run);
  const slot =
    slotIndex === -1 ? null : getFormation(run.formationId).slots[slotIndex];

  const start = () => {
    setRun(newRun(formationId));
    setSpin(null);
    setSpinKey(0);
    setShortlist([]);
    setPhase("drafting");
  };

  const doSpin = useCallback(() => {
    if (spinning || sheetOpen) return;
    const openSlot = nextOpenSlot(run);
    // Pool minimums guarantee a candidate for whatever position is open, but
    // re-spin defensively in case that invariant ever changes.
    const rng = mulberry32((Date.now() ^ (spinKey * 2654435761)) >>> 0);
    let key = spinPool(rng);
    for (let i = 0; i < 8; i++) {
      if (eligibleForSlot(run, getPool(key.club, key.decade), openSlot).length > 0) break;
      key = spinPool(rng);
    }
    setSpin(key);
    setSpinning(true);
    setSpinKey((k) => k + 1);
  }, [spinning, sheetOpen, spinKey, run]);

  const onSettled = useCallback(() => {
    setSpinning(false);
    setSheetOpen(true);
  }, []);

  // You're always picking for one position, the way a FUT draft does.
  const onPick = (player: Player) => {
    if (slotIndex === -1) return;
    const filled = applyPick(run, slotIndex, player.id);
    setRun(filled);
    setSheetOpen(false);
    if (isComplete(filled)) {
      setShortlist(managerShortlist(mulberry32(Date.now() >>> 0)));
      setPhase("manager");
    }
  };

  // The season comes from the XI and the dugout, not from a roll — this exact
  // team always plays this exact season, for you and anyone you send it to.
  const appointManager = (manager: Manager) => {
    const ready = setManager(run, manager.id);
    setRun(ready);
    setResult(playRun(ready));
    setPhase("reveal");
  };

  // Share the block, not just the link: the squares tell the story before
  // anyone has to click, and the URL rides along at the bottom.
  const share = async () => {
    if (!result) return;
    const code = encodeRun(sharedFromRun(run));
    const url = `${window.location.origin}/r/${code}`;
    const text = shareText(run, result, url);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // cancelled or unsupported payload — fall through to the clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setToast("Season copied — paste it anywhere.");
    } catch {
      setToast(url);
    }
    setTimeout(() => setToast(null), 2600);
  };

  const eligible = useMemo(
    () =>
      spin && slotIndex !== -1
        ? eligibleForSlot(run, getPool(spin.club, spin.decade), slotIndex)
        : [],
    [spin, run, slotIndex],
  );

  return (
    <main className="shell">
      <Header />

      {phase === "setup" && (
        <section style={{ marginTop: 22, display: "grid", gap: 18 }}>
          <p style={{ color: "var(--chalk-dim)", lineHeight: 1.5 }}>
            Spin the eras. Draft a full XI from football history — one player per
            spin. Then play the 38-game season and see how far the unbeaten run
            holds.
          </p>
          <div>
            <div className="eyebrow" style={{ marginBottom: 8 }}>
              Pick your shape
            </div>
            <FormationPicker selected={formationId} onSelect={setFormationId} />
          </div>
          <button className="btn" onClick={start}>
            Start drafting
          </button>
          <LadderKey />
        </section>
      )}

      {phase === "drafting" && (
        <section style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span className="eyebrow">
              {getFormation(run.formationId).name} · now picking
            </span>
            <span className="data" style={{ color: "var(--ice)" }}>
              {drafted} / 11
            </span>
          </div>

          {slot && (
            <div className="picking">
              <span className="picking-pos">{slot.label}</span>
              <span className="picking-note">
                {POSITION_NOTE[slot.label] ?? "Fill the slot"}
              </span>
            </div>
          )}

          <SplitFlap
            club={spin ? spin.club : "Invincibles"}
            decade={spin ? spin.decade : "spin to begin"}
            spinKey={spinKey}
            onSettled={onSettled}
          />

          <Pitch run={run} />

          <button className="btn" onClick={doSpin} disabled={spinning}>
            {spinning ? "…" : drafted === 0 ? "Spin" : "Spin again"}
          </button>
        </section>
      )}

      {phase === "manager" && (
        <section style={{ marginTop: 18, display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <span className="eyebrow">The last pick</span>
            <span className="data" style={{ color: "var(--ice)" }}>
              11 / 11
            </span>
          </div>
          <p style={{ color: "var(--chalk-dim)", lineHeight: 1.5, fontSize: "0.9rem" }}>
            Appoint a manager. Attacking coaches buy you goals, defensive ones
            buy clean sheets — and the season starts the moment you choose.
          </p>
          <ManagerPicker managers={shortlist} onPick={appointManager} />
          <Pitch run={run} />
        </section>
      )}

      {phase === "reveal" && result && (
        <section style={{ marginTop: 18, display: "grid", gap: 12 }}>
          <div className="eyebrow">The season · 38 games</div>
          <Vidiprinter result={result} onDone={() => setPhase("result")} />
        </section>
      )}

      {phase === "result" && result && (
        <section style={{ marginTop: 18 }}>
          <ResultView
            run={run}
            result={result}
            actions={
              <div style={{ display: "grid", gap: 8 }}>
                <button className="btn" onClick={share}>
                  Copy your season
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setResult(null);
                    setPhase("setup");
                  }}
                >
                  Draft again
                </button>
              </div>
            }
          />
        </section>
      )}

      {sheetOpen && spin && slot && (
        <PickSheet
          club={spin.club}
          decade={spin.decade}
          position={slot.label}
          eligible={eligible}
          onPick={onPick}
          onClose={() => setSheetOpen(false)}
        />
      )}

      {toast && <Toast text={toast} />}
    </main>
  );
}

function Header() {
  return (
    <header>
      <div className="eyebrow">The unbeaten season</div>
      <h1 className="wordmark" style={{ fontSize: "clamp(2.5rem, 14vw, 4.2rem)" }}>
        Invinci<span className="go">bles</span>
      </h1>
    </header>
  );
}

function LadderKey() {
  const rows: [string, string][] = [
    ["Champions", "Finish top of the table"],
    ["Invincible", "Champions, unbeaten all season"],
    ["Perfect", "Win all 38 — the grail"],
  ];
  return (
    <div className="card" style={{ display: "grid", gap: 10 }}>
      <div className="eyebrow">The ladder</div>
      {rows.map(([k, v]) => (
        <div key={k} className="ladder-row">
          <span className="k">{k}</span>
          <span className="v">{v}</span>
        </div>
      ))}
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div role="status" className="toast">
      {text}
    </div>
  );
}
