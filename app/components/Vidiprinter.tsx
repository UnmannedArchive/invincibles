"use client";

import { useEffect, useRef, useState } from "react";
import type { SeasonResult } from "@/lib/types";

type Outcome = "win" | "draw" | "loss";

function outcome(gf: number, ga: number): Outcome {
  if (gf > ga) return "win";
  if (gf < ga) return "loss";
  return "draw";
}

const LETTER: Record<Outcome, string> = { win: "W", draw: "D", loss: "L" };

/**
 * Season reveal styled as the Saturday-afternoon vidiprinter: results tick in
 * one at a time while the running W-D-L tally builds. Calls `onDone` when the
 * final match has printed.
 */
export function Vidiprinter({
  result,
  onDone,
}: {
  result: SeasonResult;
  onDone: () => void;
}) {
  const [shown, setShown] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    if (shown >= result.matches.length) {
      if (!doneRef.current) {
        doneRef.current = true;
        const t = setTimeout(onDone, 650);
        return () => clearTimeout(t);
      }
      return;
    }
    // slow slightly as the run nears its end for tension
    const remaining = result.matches.length - shown;
    const delay = remaining < 6 ? 190 : 85;
    const t = setTimeout(() => setShown((n) => n + 1), delay);
    return () => clearTimeout(t);
  }, [shown, result.matches.length, onDone]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [shown]);

  const visible = result.matches.slice(0, shown);
  let w = 0,
    d = 0,
    l = 0;
  for (const m of visible) {
    const o = outcome(m.goalsFor, m.goalsAgainst);
    if (o === "win") w++;
    else if (o === "draw") d++;
    else l++;
  }

  return (
    <div>
      <div className="vidi">
        <div className="vidi-head">
          <span>Vidiprinter · Matchday {Math.min(shown, 38)}</span>
          <span>
            {w}W {d}D {l}L
          </span>
        </div>
        <div
          className="vidi-feed"
          ref={feedRef}
          style={{ maxHeight: 240, overflowY: "auto" }}
        >
          {visible.map((m, i) => {
            const o = outcome(m.goalsFor, m.goalsAgainst);
            return (
              <div key={i} className={`vidi-line ${o}`}>
                <span className="res">{LETTER[o]}</span>
                <span>Invincibles</span>
                <span className="score">
                  {m.goalsFor}–{m.goalsAgainst}
                </span>
                <span style={{ opacity: 0.55 }}>opp {m.opponent}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div className="tally">
        <div className="cell">
          <div className="k">WON</div>
          <div className="v">{w}</div>
        </div>
        <div className="cell">
          <div className="k">DRAWN</div>
          <div className="v">{d}</div>
        </div>
        <div className="cell">
          <div className="k">LOST</div>
          <div className={l > 0 ? "v loss" : "v"}>{l}</div>
        </div>
        <div className="cell">
          <div className="k">PTS</div>
          <div className="v">{w * 3 + d}</div>
        </div>
      </div>
    </div>
  );
}
