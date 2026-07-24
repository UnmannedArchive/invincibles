"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const JOIN_KEY = "invincibles:league";

/**
 * The two things you do from a league page: add your own team to it, or copy
 * the link so the rest of the group can. "Add your team" stashes the current
 * league in sessionStorage and drops you into a fresh draft; when you finish,
 * your team appends to it (see LeagueJoin).
 */
export function LeagueActions({ path }: { path: string[] }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const addYourTeam = () => {
    sessionStorage.setItem(JOIN_KEY, JSON.stringify(path));
    router.push("/");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // clipboard blocked — the URL bar still has the link
    }
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button className="btn" onClick={addYourTeam}>
        Add your team
      </button>
      <button className="btn btn-ghost" onClick={copyLink}>
        {copied ? "Link copied" : "Copy league link"}
      </button>
    </div>
  );
}
