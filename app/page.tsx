"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getFormation } from "@/lib/formations";
import { getPool, type PoolKey } from "@/lib/data";
import {
  newRun,
  eligibleInPool,
  applyPick,
  setManager,
  firstOpenSlotFor,
  isComplete,
  spinPool,
  type RunState,
} from "@/lib/run";
import { managerShortlist, managerById, type Manager } from "@/lib/managers";
import { playRun } from "@/lib/replay";
import { sharedFromRun, encodeRun } from "@/lib/encode";
import { shareText } from "@/lib/share";
import { surnameOf } from "@/lib/kit";
import { mulberry32 } from "@/lib/rng";
import type { Player, SeasonResult } from "@/lib/types";
import { FormationPicker } from "./components/FormationPicker";
import { SplitFlap } from "./components/SplitFlap";
import { Pitch } from "./components/Pitch";
import { PickSheet } from "./components/PickSheet";
import { Vidiprinter } from "./components/Vidiprinter";
import { ResultView } from "./components/ResultView";
import { ManagerPicker } from "./components/ManagerPicker";
import { LeagueJoin, readJoiningLeague } from "./components/LeagueJoin";

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
  const [joiningCount, setJoiningCount] = useState(0);

  useEffect(() => {
    // sessionStorage is client-only, so read it after mount (see LeagueJoin).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoiningCount(readJoiningLeague()?.length ?? 0);
  }, []);

  const drafted = run.picks.filter((p) => p !== null).length;

  // Only defined once the XI is full; the league join needs a real code.
  const myCode = useMemo(
    () => (isComplete(run) ? encodeRun(sharedFromRun(run)) : ""),
    [run],
  );
  const defaultHandle = useMemo(() => {
    const manager = run.managerId !== null ? managerById(run.managerId) : null;
    return manager ? surnameOf(manager.name) : "Team";
  }, [run.managerId]);

  const start = () => {
    setRun(newRun(formationId));
    setSpin(null);
    setSpinKey(0);
    setShortlist([]);
    setPhase("drafting");
  };

  const doSpin = useCallback(() => {
    if (spinning || sheetOpen) return;
    // Every pool is guaranteed to hold someone for an open slot, but re-spin
    // defensively in case that invariant ever changes.
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

  // One player per spin, into whichever slot of theirs is still open.
  const onPick = (player: Player) => {
    const slot = firstOpenSlotFor(run, player.pos);
    if (slot === -1) return;
    const filled = applyPick(run, slot, player.id);
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
    () => (spin ? eligibleInPool(run, getPool(spin.club, spin.decade)) : []),
    [spin, run],
  );

  return (
    <main className="shell">
      {phase !== "setup" && <TopBar phase={phase} />}

      {phase === "setup" && (
        <section style={{ display: "grid", gap: 12 }}>
          {joiningCount > 0 && (
            <div className="join-banner">
              <span>
                Joining a league of {joiningCount}. Draft your XI to add it.
              </span>
              <button
                aria-label="Leave this league"
                onClick={() => {
                  sessionStorage.removeItem("invincibles:league");
                  setJoiningCount(0);
                }}
              >
                ×
              </button>
            </div>
          )}
          <div className="poster">
            <div className="poster-kicker">The unbeaten season</div>
            <h1
              className="wordmark"
              style={{ fontSize: "clamp(2.5rem, 14vw, 4.2rem)", marginTop: 6 }}
            >
              Invinci<span className="go">bles</span>
            </h1>
            <p className="poster-line">
              Spin the eras. Draft a full XI from football history — one player
              per spin — then play the 38-game season and see how far the
              unbeaten run holds.
            </p>
          </div>

          <div className="tile">
            <div className="tile-head">
              <span className="tile-title">Pick your shape</span>
              <span className="chip">Step 1</span>
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
            <span className="data" style={{ color: "var(--magenta)" }}>
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
            <span className="data" style={{ color: "var(--magenta)" }}>
              11 / 11
            </span>
          </div>
          <p style={{ color: "var(--ink-2)", lineHeight: 1.5, fontSize: "0.9rem" }}>
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
                <LeagueJoin code={myCode} defaultHandle={defaultHandle} />
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

const STAGES: { id: Phase; label: string }[] = [
  { id: "drafting", label: "Draft" },
  { id: "manager", label: "Manager" },
  { id: "reveal", label: "Season" },
  { id: "result", label: "Result" },
];

/** Menu bar: the wordmark, and which stage of a run you're on. */
function TopBar({ phase }: { phase: Phase }) {
  const current = STAGES.findIndex((s) => s.id === phase);
  return (
    <header>
      <h1
        className="wordmark wordmark-ink"
        style={{ fontSize: "clamp(1.8rem, 8vw, 2.4rem)", marginBottom: 10 }}
      >
        Invinci<span className="go">bles</span>
      </h1>
      <nav className="stages" aria-label="Progress through this run">
        {STAGES.map((stage, i) => (
          <span
            key={stage.id}
            className={i < current ? "stage is-done" : "stage"}
            aria-current={i === current ? "step" : undefined}
          >
            {stage.label}
          </span>
        ))}
      </nav>
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
