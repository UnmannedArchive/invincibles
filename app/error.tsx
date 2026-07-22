"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shell" style={{ justifyContent: "center", gap: 16 }}>
      <div className="eyebrow">Something went wrong</div>
      <h1 className="wordmark" style={{ fontSize: "clamp(2.4rem, 13.5vw, 3.8rem)" }}>
        Invinci<span className="go">bles</span>
      </h1>
      <p style={{ color: "var(--chalk-dim)", lineHeight: 1.5 }}>
        The season stopped mid-play. Your draft is gone, which is the way this
        game works — nothing is saved but the links you copy.
      </p>
      <button className="btn" onClick={reset}>
        Start again
      </button>
    </main>
  );
}
