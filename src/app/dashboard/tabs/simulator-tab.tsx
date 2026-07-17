"use client";

import { Dices, Loader2, Trophy } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, ProbabilityBar } from "@/components/ui";
import { MAX_PUBLIC_SIMULATIONS } from "@/lib/tournament/constants";
import type { TournamentSimulationSummary } from "@/lib/types";
import { pct } from "./shared";

const simulationOptions = [1, 500, MAX_PUBLIC_SIMULATIONS];

export interface ChampionDatum {
  name: string;
  champion: number;
}

export function SimulatorTab({
  simulation,
  championData,
  isSimulating,
  isPending,
  runSimulation,
  getTeamName,
}: {
  simulation: TournamentSimulationSummary;
  championData: ChampionDatum[];
  isSimulating: boolean;
  isPending: boolean;
  runSimulation: (iterations: number) => void;
  getTeamName: (teamId: string) => string;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-6">
        <Card className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">
                Monte Carlo Simulator
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Current run: {simulation.metadata.simulationCount.toLocaleString()} iterations
                | seed {simulation.metadata.seed}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {simulationOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => runSimulation(count)}
                  disabled={isSimulating}
                  aria-busy={isSimulating}
                  aria-label={`Run ${count.toLocaleString()} Monte Carlo simulations`}
                  className="inline-flex h-11 items-center gap-2 rounded-md border border-white/10 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-55"
                >
                  {isPending || isSimulating ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Dices className="size-4" aria-hidden="true" />
                  )}
                  {count.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Trophy className="size-5 text-amber-200" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-white">
              Champion Probability
            </h2>
          </div>
          <p className="sr-only">
            {`Champion probability chart. Top teams: ${championData
              .slice(0, 3)
              .map((row) => `${row.name} ${row.champion}%`)
              .join(", ")}. Full values appear in the round probability table below.`}
          </p>
          <div
            className="relative mt-5 h-[320px] min-h-[320px] min-w-0"
            role="img"
            aria-label={`Bar chart of champion probability for the top ${championData.length} teams. Values are listed in the adjacent text summary and table.`}
          >
            {isSimulating ? (
              <div
                className="absolute inset-0 z-10 grid place-items-center rounded-md bg-[#0b1712]/70 backdrop-blur-sm"
                role="status"
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  Simulating tournament…
                </span>
              </div>
            ) : null}
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
              initialDimension={{ width: 640, height: 320 }}
            >
              <BarChart data={championData}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <YAxis tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.06)" }}
                  contentStyle={{
                    background: "#0d1a15",
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                />
                <Bar dataKey="champion" fill="#6ee7b7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white">
              Round Probability Table
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Top teams by title probability, with deep-run probabilities.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Team</th>
                  <th className="px-3 py-3">QF</th>
                  <th className="px-3 py-3">SF</th>
                  <th className="px-3 py-3">Final</th>
                  <th className="px-3 py-3">Champion</th>
                </tr>
              </thead>
              <tbody>
                {simulation.probabilities.slice(0, 8).map((row) => (
                  <tr key={row.teamId} className="border-t border-white/5">
                    <td className="px-5 py-3 font-semibold text-white">
                      {getTeamName(row.teamId)}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      {pct(row.quarterFinal)}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      {pct(row.semiFinal)}
                    </td>
                    <td className="px-3 py-3 text-zinc-300">
                      {pct(row.final)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-emerald-200">
                      {pct(row.champion)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-white">
            Group Qualification Probability
          </h2>
          <div className="mt-4 space-y-3">
            {simulation.qualificationProbabilities.slice(0, 5).map((row) => (
              <div key={row.teamId}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-200">
                    {getTeamName(row.teamId)}
                  </span>
                  <span className="font-semibold text-white">
                    {pct(row.groupAdvance)}
                  </span>
                </div>
                <ProbabilityBar value={row.groupAdvance} />
                <p className="mt-1 text-xs text-zinc-400">
                  Top-two {pct(row.topTwo)} | best third {pct(row.bestThirdPlace)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-lg font-semibold text-white">
            Interactive Bracket Path
          </h2>
          <p className="mt-1 text-sm text-zinc-400">
            Single seeded tournament path from the latest simulation run.
          </p>
        </div>
        <div className="grid gap-4 overflow-x-auto p-5 lg:grid-cols-3">
          {simulation.single.bracket.map((round) => (
            <div key={round.name} className="min-w-[260px]">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
                {round.name}
              </h3>
              <div className="space-y-3">
                {round.matches.map((match) => (
                  <div
                    key={match.id}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-sm ${
                          match.winnerTeamId === match.homeTeamId
                            ? "font-semibold text-white"
                            : "text-zinc-400"
                        }`}
                      >
                        {getTeamName(match.homeTeamId)}
                      </span>
                      <span className="font-mono text-sm text-zinc-200">
                        {match.homeGoals}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span
                        className={`text-sm ${
                          match.winnerTeamId === match.awayTeamId
                            ? "font-semibold text-white"
                            : "text-zinc-400"
                        }`}
                      >
                        {getTeamName(match.awayTeamId)}
                      </span>
                      <span className="font-mono text-sm text-zinc-200">
                        {match.awayGoals}
                      </span>
                    </div>
                    {match.wentToPenalties ? (
                      <p className="mt-2 text-xs text-amber-200">
                        Advanced on penalties
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
