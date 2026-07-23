import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell" style={{ justifyContent: "center", gap: 16 }}>
      <div className="eyebrow">Offside</div>
      <h1 className="wordmark wordmark-ink" style={{ fontSize: "clamp(2.6rem, 15vw, 4rem)" }}>
        Invinci<span className="go">bles</span>
      </h1>
      <p style={{ color: "var(--ink-2)", lineHeight: 1.5 }}>
        There&rsquo;s no season at this address. A share link may have been
        truncated on its way to you, or it&rsquo;s from an older version of the
        game.
      </p>
      <Link className="btn" href="/" style={{ textAlign: "center" }}>
        Draft your own XI
      </Link>
    </main>
  );
}
