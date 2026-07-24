"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sanitizeHandle } from "@/lib/league";

const JOIN_KEY = "invincibles:league";

/** The league you're adding this team to, if you arrived from one. */
export function readJoiningLeague(): string[] | null {
  try {
    const raw = sessionStorage.getItem(JOIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : null;
  } catch {
    return null;
  }
}

/**
 * On your result screen: name this team and add it to a league. If you came
 * from a friend's league link, this appends to it; otherwise it starts a fresh
 * one with just you, and the link you get is what you send round.
 */
export function LeagueJoin({ code, defaultHandle }: { code: string; defaultHandle: string }) {
  const router = useRouter();
  const [joining, setJoining] = useState<string[] | null>(null);
  const [name, setName] = useState(defaultHandle);

  useEffect(() => {
    // Read after mount, not during render: the server has no sessionStorage,
    // so a first render matching it (null) then updating is the hydration-safe
    // way to do this — the one intended update, not a cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setJoining(readJoiningLeague());
  }, []);

  const add = () => {
    const handle = sanitizeHandle(name) || sanitizeHandle(defaultHandle) || "Team";
    const segments = [...(joining ?? []), `${handle}~${code}`];
    sessionStorage.removeItem(JOIN_KEY);
    router.push(`/l/${segments.join("/")}`);
  };

  return (
    <div className="join">
      <div className="join-head">
        {joining && joining.length > 0
          ? `Join the league · ${joining.length} already in`
          : "Start a league"}
      </div>
      <div className="join-row">
        <input
          className="join-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={14}
          aria-label="Your team name"
          placeholder="Your name"
        />
        <button className="btn join-btn" onClick={add}>
          {joining && joining.length > 0 ? "Join" : "Create"}
        </button>
      </div>
    </div>
  );
}
