"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, Radio } from "lucide-react";

import { LIVE_REFRESH_SECONDS } from "@/lib/live/constants";
import { detectScoreChanges } from "@/lib/live/diff";
import type { LiveMatch, LiveScoresPayload } from "@/lib/live/types";
import type { ApiResponse } from "@/lib/types";

const GOAL_FLASH_MS = 6000;

function kickoffLabel(utcDate: string): string {
  const time = Date.parse(utcDate);

  if (Number.isNaN(time)) {
    return "TBD";
  }

  return new Date(time).toLocaleString(undefined, {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function scoreLabel(match: LiveMatch): string {
  return `${match.homeScore ?? 0}–${match.awayScore ?? 0}`;
}

function MatchChip({ match, goal }: { match: LiveMatch; goal: boolean }) {
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const isUpcoming = match.status === "upcoming";

  return (
    <li
      className={`flex shrink-0 items-center gap-3 rounded-md border px-3 py-1.5 text-sm transition-colors ${
        goal
          ? "live-goal-flash border-emerald-300/50 bg-emerald-300/10"
          : "border-white/10 bg-white/[0.04]"
      }`}
    >
      <span className="font-semibold text-zinc-200">{match.homeCode}</span>
      {isUpcoming ? (
        <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
          <Clock className="size-3.5" aria-hidden="true" />
          {kickoffLabel(match.utcDate)}
        </span>
      ) : (
        <span className="font-mono font-semibold text-white">
          {scoreLabel(match)}
        </span>
      )}
      <span className="font-semibold text-zinc-200">{match.awayCode}</span>

      {goal ? (
        <span className="rounded bg-emerald-300 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-950">
          Goal
        </span>
      ) : isLive ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-300" aria-hidden="true" />
          {match.minute ? `${match.minute}'` : "Live"}
        </span>
      ) : isFinished ? (
        <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          FT
        </span>
      ) : null}
    </li>
  );
}

export function LiveScoreStrip() {
  const [payload, setPayload] = useState<LiveScoresPayload | null>(null);
  const [failed, setFailed] = useState(false);
  const [goalIds, setGoalIds] = useState<Set<string>>(new Set());
  const previousMatches = useRef<LiveMatch[]>([]);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      try {
        const response = await fetch("/api/live", { cache: "no-store" });
        const json = (await response.json()) as ApiResponse<LiveScoresPayload>;

        if (cancelled) {
          return;
        }

        if (json.ok) {
          const goals = detectScoreChanges(previousMatches.current, json.data.matches);

          if (goals.length > 0) {
            setGoalIds(new Set(goals));
            clearTimeout(flashTimer);
            flashTimer = setTimeout(() => {
              if (!cancelled) {
                setGoalIds(new Set());
              }
            }, GOAL_FLASH_MS);
          }

          previousMatches.current = json.data.matches;
          setPayload(json.data);
          setFailed(false);
        } else {
          setFailed(true);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      } finally {
        if (!cancelled) {
          pollTimer = setTimeout(poll, LIVE_REFRESH_SECONDS * 1000);
        }
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
      clearTimeout(flashTimer);
    };
  }, []);

  const loading = !payload && !failed;
  const unavailable = failed || payload?.status === "unavailable";
  const matches = payload?.status === "available" ? payload.matches : [];

  return (
    <section
      aria-label="Near-live World Cup scores"
      className="border-b border-white/10 bg-[#081310]"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-4 px-4 py-2 sm:px-6 lg:px-8">
        <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-200">
          <Radio className="size-4" aria-hidden="true" />
          {payload?.label ?? "Near-live, ~45s refresh"}
        </span>

        {loading ? (
          <span className="text-xs text-zinc-500">Checking for matches…</span>
        ) : unavailable ? (
          <span className="truncate text-xs text-zinc-500">
            Scores unavailable —{" "}
            {payload?.reason ??
              "live provider not configured. The offline dataset stays available."}
          </span>
        ) : matches.length === 0 ? (
          <span className="text-xs text-zinc-500">
            No World Cup matches in the current window.
          </span>
        ) : (
          <ul className="flex items-center gap-2 overflow-x-auto">
            {matches.map((match) => (
              <MatchChip key={match.id} match={match} goal={goalIds.has(match.id)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
