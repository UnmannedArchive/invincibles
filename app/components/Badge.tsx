import { clubStyle, leagueOf } from "@/lib/clubs";
import { monogramOf } from "@/lib/kit";

/**
 * A club badge drawn from the club's kit rather than its crest: the shirt
 * colours, the pattern they actually play in, and the club's initials. Nobody's
 * trademark, and it still reads as "that's the Juve one" at a glance.
 */
export function Crest({ club, size = 22 }: { club: string; size?: number }) {
  const { primary, secondary, pattern } = clubStyle(club);

  const fill =
    pattern === "stripes"
      ? `repeating-linear-gradient(90deg, ${primary} 0 22%, ${secondary} 22% 44%)`
      : pattern === "hoops"
        ? `repeating-linear-gradient(180deg, ${primary} 0 26%, ${secondary} 26% 52%)`
        : pattern === "halves"
          ? `linear-gradient(90deg, ${primary} 0 50%, ${secondary} 50% 100%)`
          : pattern === "sash"
            ? `linear-gradient(115deg, ${primary} 0 38%, ${secondary} 38% 62%, ${primary} 62% 100%)`
            : pattern === "sleeves"
              ? `linear-gradient(90deg, ${secondary} 0 18%, ${primary} 18% 82%, ${secondary} 82% 100%)`
              : primary;

  return (
    <span
      className="crest"
      title={club}
      style={{ width: size, height: size * 1.15, background: fill }}
    >
      <span className="crest-mono">{monogramOf(club)}</span>
    </span>
  );
}

/** The club's league, as its national flag. Flags aren't anyone's copyright. */
export function Flag({ club, width = 20 }: { club: string; width?: number }) {
  const league = leagueOf(club);
  const height = Math.round(width * 0.68);

  if (league.orientation === "cross") {
    // St George: white field, red cross
    return (
      <span
        className="flag"
        title={league.name}
        style={{
          width,
          height,
          background: `
            linear-gradient(90deg, transparent 0 40%, ${league.bands[1]} 40% 60%, transparent 60%),
            linear-gradient(180deg, transparent 0 38%, ${league.bands[1]} 38% 62%, transparent 62%),
            ${league.bands[0]}
          `,
        }}
      />
    );
  }

  const direction = league.orientation === "vertical" ? "90deg" : "180deg";
  const step = 100 / league.bands.length;
  const stops = league.bands
    .map((c, i) => `${c} ${i * step}% ${(i + 1) * step}%`)
    .join(", ");

  return (
    <span
      className="flag"
      title={league.name}
      style={{ width, height, background: `linear-gradient(${direction}, ${stops})` }}
    />
  );
}
