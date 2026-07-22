"use client";

import { useCallback, useMemo, useState } from "react";
import { getFormation } from "@/lib/formations";
import { getPool, type PoolKey } from "@/lib/data";
import {
  newRun,
  eligibleInPool,
  applyPick,
  isComplete,
  orderedXI,
  spinPool,
  type RunState,
} from "@/lib/run";
import { simulateSeason } from "@/lib/sim";
import { sharedFromRun, encodeRun } from "@/lib/encode";
import { mulberry32 } from "@/lib/rng";
import type { Player, SeasonResult } from "@/lib/types";
import { FormationPicker } from "./components/FormationPicker";
import { SplitFlap } from "./components/SplitFlap";
import { Pitch } from "./components/Pitch";
import { PickSheet } from "./components/PickSheet";
import { Vidiprinter } from "./components/Vidiprinter";
import { ResultView } from "./components/ResultView";

type Phase = "setup" | "drafting" | "reveal" | "result";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [formationId, setFormationId] = useState(0);
  const [run, setRun] = useState<RunState>(() => newRun(0));
  const [spinKey, setSpinKey] = useState(0);
  const [spin, setSpin] = useState<PoolKey | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [seed, setSeed] = useState(0);
  const [result, setResult] = useState<SeasonResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const drafted = run.picks.filter((p) => p !== null).length;
  const complete = isComplete(run);

  const start = () => {
    setRun(newRun(formationId));
    setSpin(null);
    setSpinKey(0);
    setPhase("drafting");
  };

  const doSpin = useCallback(() => {
    if (spinning || sheetOpen) return;
    // Every pool is guaranteed to hold an eligible player for an open slot,
    // but guard defensively in case that invariant ever changes.
    const rng = mulberry32((Date.now() ^ (spinKey * 2654435761)) >>> 0);
    let key = spinPool(rng);
    for (let i = 0; i < 8; i++) {
      if (eligibleInPool(run, getPool(key.club, key.decade)).length > 0) break;
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

  const onPick = (player: Player) => {
    const formation = getFormation(run.formationId);
    const slot = formation.slots.findIndex(
      (s, i) => s.pos === player.pos && run.picks[i] === null,
    );
    if (slot === -1) return;
    setRun((r) => applyPick(r, slot, player.id));
    setSheetOpen(false);
  };

  const playSeason = () => {
    const s = Math.floor(Math.random() * 0xffffffff) >>> 0;
    const res = simulateSeason(orderedXI(run), run.formationId, s);
    setSeed(s);
    setResult(res);
    setPhase("reveal");
  };

  const share = async () => {
    const code = encodeRun(sharedFromRun(run, seed));
    const url = `${window.location.origin}/r/${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied — paste it anywhere.");
    } catch {
      setToast(url);
    }
    setTimeout(() => setToast(null), 2600);
  };

  const eligible = useMemo(
    () => (spin ? eligibleInPool(run, getPool(spin.club, spin.decade)) : []),
    [spin, run],
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
              {getFormation(run.formationId).name} · drafting
            </span>
            <span className="data" style={{ color: "var(--gold)" }}>
              {drafted} / 11
            </span>
          </div>

          <SplitFlap
            club={spin ? spin.club : "Invincibles"}
            decade={spin ? spin.decade : "spin to begin"}
            spinKey={spinKey}
            onSettled={onSettled}
          />

          <Pitch run={run} />

          {complete ? (
            <button className="btn" onClick={playSeason}>
              Play the season
            </button>
          ) : (
            <button className="btn" onClick={doSpin} disabled={spinning}>
              {spinning ? "…" : drafted === 0 ? "Spin" : "Spin again"}
            </button>
          )}
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

      {sheetOpen && spin && (
        <PickSheet
          club={spin.club}
          decade={spin.decade}
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
      <h1 className="wordmark" style={{ fontSize: "clamp(3rem, 17vw, 4.6rem)" }}>
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
    <div className="card" style={{ display: "grid", gap: 8 }}>
      <div className="eyebrow">The ladder</div>
      {rows.map(([k, v]) => (
        <div
          key={k}
          style={{ display: "flex", justifyContent: "space-between", gap: 12 }}
        >
          <span
            className="display"
            style={{ fontSize: "1.05rem", color: "var(--gold)" }}
          >
            {k}
          </span>
          <span
            style={{
              color: "var(--chalk-dim)",
              fontSize: "0.8rem",
              textAlign: "right",
            }}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

function Toast({ text }: { text: string }) {
  return (
    <div
      role="status"
      style={{
        position: "fixed",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        background: "var(--panel-2)",
        border: "1px solid var(--gold)",
        color: "var(--chalk)",
        padding: "12px 18px",
        borderRadius: 10,
        fontSize: "0.85rem",
        zIndex: 50,
        maxWidth: "90vw",
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}
