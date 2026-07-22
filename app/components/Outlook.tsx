"use client";

import { useEffect, useState } from "react";
import { squadOutlook, type Outlook as OutlookData } from "@/lib/outlook";
import type { RunState } from "@/lib/run";
import type { SeasonResult } from "@/lib/types";

const SAMPLES = 1000;

function verdict(percentile: number): string {
  if (percentile >= 90) return "One of this squad's best seasons.";
  if (percentile >= 65) return "A good season for this squad.";
  if (percentile >= 35) return "About what this squad had in it.";
  if (percentile >= 10) return "This squad had more in it than that.";
  return "You were robbed. This squad is better than that.";
}

/**
 * "The season you didn't get": the same XI replayed across a thousand other
 * seeds, so a player can see whether they were unlucky. Deferred to an effect
 * because a thousand seasons is real work — the result should paint first.
 */
export function Outlook({ run, result }: { run: RunState; result: SeasonResult }) {
  const [data, setData] = useState<OutlookData | null>(null);
  const key = `${run.formationId}:${run.managerId}:${run.picks.join(",")}:${result.points}`;

  useEffect(() => {
    let live = true;
    const id = setTimeout(() => {
      const outlook = squadOutlook(run, result, SAMPLES);
      if (live) setData(outlook);
    }, 30);
    return () => {
      live = false;
      clearTimeout(id);
    };
    // the key covers every input that changes the outlook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!data) {
    return (
      <div className="outlook">
        <div className="eyebrow">The season you didn&rsquo;t get</div>
        <p className="outlook-loading">Replaying this squad&rsquo;s season a thousand times…</p>
      </div>
    );
  }

  const tallest = Math.max(...data.buckets.map((b) => b.count));

  return (
    <figure className="outlook">
      <figcaption>
        <div className="eyebrow">The season you didn&rsquo;t get</div>
        <p className="outlook-lede">
          This XI played {SAMPLES.toLocaleString()} other seasons. You finished
          above <b>{data.percentile}%</b> of them — {verdict(data.percentile)}
        </p>
      </figcaption>

      <div className="outlook-chart" role="img"
        aria-label={`Points across ${SAMPLES} simulated seasons, from ${data.worst} to ${data.best}, median ${data.median}. This season scored ${result.points}, above ${data.percentile}% of them.`}
      >
        {data.buckets.map((b) => (
          <div
            key={b.from}
            className={b.isYou ? "outlook-bar is-you" : "outlook-bar"}
            style={{ height: `${Math.max(2, (b.count / tallest) * 100)}%` }}
            title={`${b.from}–${b.to} pts · ${b.count} of ${SAMPLES} seasons`}
          >
            {b.isYou && <span className="outlook-flag">You</span>}
          </div>
        ))}
      </div>

      <div className="outlook-axis">
        <span>{data.worst} pts</span>
        <span>median {data.median}</span>
        <span>{data.best} pts</span>
      </div>

      <dl className="outlook-rates">
        <div>
          <dt>Wins the league</dt>
          <dd>{data.championsPct}%</dd>
        </div>
        <div>
          <dt>Goes unbeaten</dt>
          <dd>{data.unbeatenPct}%</dd>
        </div>
        <div>
          <dt>Wins all 38</dt>
          <dd>{data.perfectPct}%</dd>
        </div>
      </dl>
    </figure>
  );
}
