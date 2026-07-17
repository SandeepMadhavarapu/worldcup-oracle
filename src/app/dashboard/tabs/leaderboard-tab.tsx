"use client";

import Link from "next/link";
import { Loader2, Save, Share2 } from "lucide-react";

import { Card } from "@/components/ui";
import type { LeaderboardEntry, Team } from "@/lib/types";
import { SelectTeam } from "./shared";

export function LeaderboardTab({
  teams,
  playerName,
  setPlayerName,
  championPick,
  setChampionPick,
  finalistPick,
  setFinalistPick,
  isSaving,
  saveBracket,
  savedBracketId,
  leaderboard,
  getTeamName,
}: {
  teams: Team[];
  playerName: string;
  setPlayerName: (name: string) => void;
  championPick: string;
  setChampionPick: (teamId: string) => void;
  finalistPick: string;
  setFinalistPick: (teamId: string) => void;
  isSaving: boolean;
  saveBracket: () => void;
  savedBracketId: string | null;
  leaderboard: LeaderboardEntry[];
  getTeamName: (teamId: string) => string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Save className="size-5 text-emerald-200" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">
            Prediction Game
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Demo placeholder leaderboard. Scores are model-aligned demo
          points from the baseline simulation; saved entries and links
          live in memory and reset on cold starts until a database
          adapter is wired.
        </p>
        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
              Display name
            </span>
            <input
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              className="h-12 w-full rounded-md border border-white/10 bg-[#0d1a15] px-3 text-sm text-white transition hover:border-emerald-300/40"
            />
          </label>
          <SelectTeam
            label="Champion pick"
            value={championPick}
            teams={teams}
            onChange={setChampionPick}
          />
          <SelectTeam
            label="Finalist pick"
            value={finalistPick}
            teams={teams}
            onChange={setFinalistPick}
          />
          <button
            type="button"
            onClick={saveBracket}
            disabled={isSaving}
            aria-busy={isSaving}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            {isSaving ? "Saving..." : "Save demo bracket"}
          </button>
          {savedBracketId ? (
            <Link
              href={`/bracket/${savedBracketId}`}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/15"
            >
              <Share2 className="size-4" aria-hidden="true" />
              View temporary bracket link
            </Link>
          ) : null}
        </div>
      </Card>
      <Card className="overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            Demo Placeholder Leaderboard
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Points are not real tournament grading yet.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-zinc-400">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Champion</th>
                <th className="px-5 py-3">Finalist</th>
                <th className="px-5 py-3">Demo score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr className="border-t border-white/5">
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-zinc-400"
                  >
                    No brackets saved yet — save one from the Simulator
                    tab to appear here.
                  </td>
                </tr>
              ) : null}
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className="border-t border-white/5">
                  <td className="px-5 py-4 text-zinc-400">{index + 1}</td>
                  <td className="px-5 py-4 font-semibold text-white">
                    <Link
                      href={`/bracket/${entry.id}`}
                      className="text-white underline-offset-4 transition hover:text-emerald-200 hover:underline"
                    >
                      {entry.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 text-zinc-300">
                    {getTeamName(entry.championTeamId)}
                  </td>
                  <td className="px-5 py-4 text-zinc-300">
                    {entry.finalistTeamId
                      ? getTeamName(entry.finalistTeamId)
                      : "Open"}
                  </td>
                  <td className="px-5 py-4 font-semibold text-emerald-200">
                    {entry.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
