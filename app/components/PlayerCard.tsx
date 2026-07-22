import { attributesFor } from "@/lib/attributes";
import { eraOf, monogramOf, surnameOf, tierOf } from "@/lib/kit";
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
  onPick,
}: {
  player: Player;
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
            <span className="fut-pos">{player.pos}</span>
            <span className="fut-rule" />
            <span className="fut-era">{eraOf(player)}</span>
            <span className="fut-badge">{monogramOf(player.club)}</span>
          </span>
          <Shards />
        </span>

        <span className="fut-name">{surnameOf(player.name)}</span>

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

/** Pitch-sized: rating, position, surname — no room for the stat block. */
export function MiniCard({ player }: { player: Player }) {
  return (
    <span className={`fut fut-sm fut-${tierOf(player.rating)}`}>
      <span className="fut-body">
        <span className="fut-stat">
          <span className="fut-rating">{player.rating}</span>
          <span className="fut-pos">{player.pos}</span>
        </span>
        <span className="fut-name">{surnameOf(player.name)}</span>
      </span>
    </span>
  );
}
