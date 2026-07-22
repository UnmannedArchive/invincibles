"use client";

import { useEffect, useRef, useState } from "react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const WIDTH = 16; // fixed board width in flaps

function pad(text: string): string {
  const t = text.toUpperCase().slice(0, WIDTH);
  const left = Math.floor((WIDTH - t.length) / 2);
  return " ".repeat(left) + t + " ".repeat(WIDTH - t.length - left);
}

function Row({ text, kind }: { text: string; kind?: "decade" }) {
  return (
    <div className="flap-row">
      {text.split("").map((ch, i) => (
        <span
          key={i}
          className={`flap settling${kind === "decade" ? " flap-decade" : ""}`}
        >
          {ch === " " ? " " : ch}
        </span>
      ))}
    </div>
  );
}

/**
 * Split-flap board that scrambles, then settles left-to-right onto the target
 * club and decade. `spinKey` changing (re)starts the animation; `onSettled`
 * fires once the board locks.
 */
export function SplitFlap({
  club,
  decade,
  spinKey,
  onSettled,
}: {
  club: string;
  decade: string;
  spinKey: number;
  onSettled: () => void;
}) {
  const [clubText, setClubText] = useState(() => pad(club));
  const [decadeText, setDecadeText] = useState(() => pad(decade));
  const settledRef = useRef(false);

  useEffect(() => {
    if (spinKey === 0) return; // no animation before the first spin
    settledRef.current = false;
    const targetClub = pad(club);
    const targetDecade = pad(decade);
    const total = 22; // frames
    let frame = 0;

    const scramble = (target: string, lockedThrough: number) =>
      target
        .split("")
        .map((ch, i) =>
          i <= lockedThrough || ch === " "
            ? ch
            : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
        )
        .join("");

    const id = setInterval(() => {
      frame++;
      // characters lock progressively left-to-right over the run
      const lockedThrough = Math.floor((frame / total) * WIDTH) - 1;
      setClubText(scramble(targetClub, lockedThrough));
      setDecadeText(scramble(targetDecade, lockedThrough));
      if (frame >= total) {
        clearInterval(id);
        setClubText(targetClub);
        setDecadeText(targetDecade);
        if (!settledRef.current) {
          settledRef.current = true;
          onSettled();
        }
      }
    }, 45);

    return () => clearInterval(id);
    // onSettled intentionally excluded: spinKey drives one run per spin
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinKey, club, decade]);

  return (
    <div className="flapboard" aria-live="polite">
      <Row text={clubText} />
      <Row text={decadeText} kind="decade" />
    </div>
  );
}
