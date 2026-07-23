import { attributesFor } from "@/lib/attributes";
import { displayName, tierOf } from "@/lib/kit";
import { roleOf } from "@/lib/roles";
import { Crest, Flag } from "./Badge";
import type { Player } from "@/lib/types";

/** The crystal shards a Team of the Year card wears instead of a photo. */
function Shards() {
  return (
    <svg className="fut-shards" viewBox="0 0 60 96" aria-hidden="true">
      <g fill="currentColor">
        <path d="M42 0 L60 0 L60 34 L30 96 L16 96 Z" opacity="0.22" />
        <path d="M56 6 L60 44 L34 96 L26 96 Z" opacity="0.16" />
        <path d="M20 34 L44 10 L40 96 L30 96 Z" opacity="0.1" />
      </g>
    </svg>
  );
}

export function PlayerCard({
  player,
  position,
  onPick,
}: {
  player: Player;
  position?: string;
  onPick?: (player: Player) => void;
}) {
  const tier = tierOf(player.rating);
  const attrs = attributesFor(player);
  const Tag = onPick ? "button" : "div";

  return (
    <Tag
      className={`fut fut-lg fut-${tier}`}
      onClick={onPick ? () => onPick(player) : undefined}
      aria-label={onPick ? `Pick ${player.name}, rated ${player.rating}` : undefined}
    >
      <span className="fut-body">
        <span className="fut-head">
          <span className="fut-stat">
            <span className="fut-rating">{player.rating}</span>
            <span className="fut-pos">{position ?? roleOf(player)}</span>
            <span className="fut-rule" />
            <Flag club={player.club} />
            <Crest club={player.club} />
            <span className="fut-era">{player.decade}</span>
          </span>
          <Shards />
        </span>

        <span className="fut-name">{displayName(player)}</span>

        <span className="fut-attrs">
          {attrs.map((a) => (
            <span key={a.key} className="fut-attr">
              <b>{a.value}</b> {a.key}
            </span>
          ))}
        </span>
      </span>
    </Tag>
  );
}

/**
 * Pitch-sized: rating, position, name — no room for the stat block. `position`
 * is the slot the player was drafted into (LB, CDM, RW …) rather than their
 * broad group, so the pitch reads like a team sheet.
 */
export function MiniCard({ player, position }: { player: Player; position?: string }) {
  return (
    <span className={`fut fut-sm fut-${tierOf(player.rating)}`}>
      <span className="fut-body">
        <span className="fut-stat">
          <span className="fut-rating">{player.rating}</span>
          <span className="fut-pos">{position ?? roleOf(player)}</span>
        </span>
        <span className="fut-mini-badge">
          <Crest club={player.club} size={13} />
        </span>
        <span className="fut-name">{displayName(player)}</span>
      </span>
    </span>
  );
}
