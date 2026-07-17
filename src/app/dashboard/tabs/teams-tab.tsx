"use client";

import Link from "next/link";

import { Card, ProbabilityBar } from "@/components/ui";
import type { Team, TeamRating, TeamRoundProbability } from "@/lib/types";
import { pct, SelectTeam } from "./shared";

export function TeamsTab({
  teams,
  teamFocusId,
  setTeamFocusId,
  focusTeam,
  focusRating,
  focusProbability,
}: {
  teams: Team[];
  teamFocusId: string;
  setTeamFocusId: (teamId: string) => void;
  focusTeam: Team;
  focusRating: TeamRating | undefined;
  focusProbability: TeamRoundProbability;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card className="p-5">
        <SelectTeam
          label="Team intelligence"
          value={teamFocusId}
          teams={teams}
          onChange={setTeamFocusId}
        />
        <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-5">
          <div
            className="mb-5 h-2 rounded"
            style={{ backgroundColor: focusTeam.accent }}
          />
          <h2 className="text-2xl font-semibold text-white">
            {focusTeam.name}
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            {focusTeam.confederation} | Group {focusTeam.group}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Rating
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {Math.round(focusRating?.rating ?? focusTeam.eloSeed)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Form
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {(focusRating?.form ?? focusTeam.form).toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Attack
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {(focusRating?.attack ?? focusTeam.attack).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Defense
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {(focusRating?.defense ?? focusTeam.defense).toFixed(2)}
              </p>
            </div>
          </div>
          <Link
            href={`/teams/${focusTeam.id}`}
            className="mt-5 inline-flex h-11 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98] motion-reduce:active:scale-100"
          >
            Full team page
          </Link>
        </div>
      </Card>
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-white">
          Most likely finish
        </h2>
        <div className="mt-5 space-y-5">
          {[
            ["Reach Round of 32", focusProbability.roundOf32],
            ["Reach Round of 16", focusProbability.roundOf16],
            ["Reach Quarter-finals", focusProbability.quarterFinal],
            ["Reach Semi-finals", focusProbability.semiFinal],
            ["Reach Final", focusProbability.final],
            ["Win Tournament", focusProbability.champion],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-200">
                  {label as string}
                </span>
                <span className="font-semibold text-white">
                  {pct(value as number)}
                </span>
              </div>
              <ProbabilityBar value={value as number} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
