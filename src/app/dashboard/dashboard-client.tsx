"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  BrainCircuit,
  ClipboardList,
  Dices,
  Gauge,
  LineChart,
  Loader2,
  Medal,
  Save,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, ProbabilityBar, Section, Shell, StatusPill } from "@/components/ui";
import { MAX_PUBLIC_SIMULATIONS } from "@/lib/tournament/constants";
import type {
  LeaderboardEntry,
  MatchPrediction,
  QualificationStatus,
  Team,
  TeamRating,
  TournamentSimulationSummary,
  ApiResponse,
} from "@/lib/types";

type TabId = "groups" | "predictor" | "simulator" | "teams" | "leaderboard";

interface DashboardClientProps {
  teams: Team[];
  ratings: TeamRating[];
  initialSimulation: TournamentSimulationSummary;
  initialLeaderboard: LeaderboardEntry[];
  notice: string;
}

interface PredictionPayload {
  prediction: MatchPrediction;
}

interface SimulationPayload {
  simulation: TournamentSimulationSummary;
}

interface LeaderboardPayload {
  entries: LeaderboardEntry[];
}

const tabs: Array<{
  id: TabId;
  label: string;
  icon: typeof BarChart3;
}> = [
  { id: "groups", label: "Groups", icon: ClipboardList },
  { id: "predictor", label: "Predictor", icon: Activity },
  { id: "simulator", label: "Simulator", icon: Dices },
  { id: "teams", label: "Teams", icon: Users },
  { id: "leaderboard", label: "Leaderboard", icon: Medal },
];
const simulationOptions = [1, 500, MAX_PUBLIC_SIMULATIONS];

function pct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function statusTone(status: QualificationStatus) {
  if (status === "qualified") {
    return "emerald";
  }

  if (status === "third-place bubble") {
    return "amber";
  }

  if (status === "eliminated") {
    return "rose";
  }

  return "zinc";
}

async function readApi<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiResponse<T>;

  if (!payload.ok) {
    throw new Error(payload.error.message);
  }

  return payload.data;
}

function SelectTeam({
  label,
  value,
  teams,
  onChange,
}: {
  label: string;
  value: string;
  teams: Team[];
  onChange: (teamId: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-md border border-white/10 bg-[#0d1a15] px-3 text-sm text-white outline-none transition hover:border-emerald-300/40"
      >
        {teams.map((team) => (
          <option key={team.id} value={team.id}>
            {team.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function RoundBadge({ children }: { children: string }) {
  return (
    <span className="rounded border border-white/10 bg-white/10 px-2 py-1 text-xs font-semibold text-zinc-200">
      {children}
    </span>
  );
}

export function DashboardClient({
  teams,
  ratings,
  initialSimulation,
  initialLeaderboard,
  notice,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabId>("groups");
  const [teamAId, setTeamAId] = useState("argentina");
  const [teamBId, setTeamBId] = useState("france");
  const [teamFocusId, setTeamFocusId] = useState("argentina");
  const [prediction, setPrediction] = useState<MatchPrediction | null>(null);
  const [simulation, setSimulation] =
    useState<TournamentSimulationSummary>(initialSimulation);
  const [leaderboard, setLeaderboard] =
    useState<LeaderboardEntry[]>(initialLeaderboard);
  const [savedBracketId, setSavedBracketId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("Portfolio Reviewer");
  const [championPick, setChampionPick] = useState("argentina");
  const [finalistPick, setFinalistPick] = useState("france");
  const [error, setError] = useState<string | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();

  const teamMap = useMemo(
    () => new Map(teams.map((team) => [team.id, team])),
    [teams],
  );
  const ratingMap = useMemo(
    () => new Map(ratings.map((rating) => [rating.teamId, rating])),
    [ratings],
  );
  const championData = simulation.probabilities.slice(0, 10).map((row) => ({
    name: teamMap.get(row.teamId)?.code ?? row.teamId,
    champion: Number((row.champion * 100).toFixed(1)),
  }));
  const focusTeam = teamMap.get(teamFocusId) ?? teams[0];
  const focusRating = ratingMap.get(teamFocusId);
  const focusProbability =
    simulation.probabilities.find((row) => row.teamId === teamFocusId) ??
    simulation.probabilities[0];
  const mostLikelyFinalA =
    teamMap.get(simulation.mostLikelyFinal.teamAId)?.name ?? "TBD";
  const mostLikelyFinalB =
    teamMap.get(simulation.mostLikelyFinal.teamBId)?.name ?? "TBD";
  const darkHorse =
    teamMap.get(simulation.analytics.darkHorse.teamId)?.name ?? "TBD";
  const upsetTeam =
    teamMap.get(simulation.analytics.upsetRisk.teamId)?.name ?? "TBD";

  const getTeamName = (teamId: string) => teamMap.get(teamId)?.name ?? teamId;
  const getTeamCode = (teamId: string) => teamMap.get(teamId)?.code ?? teamId;

  async function runPrediction() {
    setError(null);
    setIsPredicting(true);

    try {
      const response = await fetch("/api/predict-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAId, teamBId }),
      });
      const payload = await readApi<PredictionPayload>(response);
      setPrediction(payload.prediction);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Prediction request failed.");
    } finally {
      setIsPredicting(false);
    }
  }

  function runSimulation(iterations: number) {
    setError(null);
    setIsSimulating(true);
    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch("/api/simulate-tournament", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              iterations,
              seed: `dashboard-${iterations}`,
            }),
          });
          const payload = await readApi<SimulationPayload>(response);
          setSimulation(payload.simulation);
          setActiveTab("simulator");
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : "Simulation request failed.");
        } finally {
          setIsSimulating(false);
        }
      })();
    });
  }

  async function saveBracket() {
    setError(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/save-bracket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: playerName,
          championTeamId: championPick,
          finalistTeamId: finalistPick,
        }),
      });

      const { entry } = await readApi<{ entry: LeaderboardEntry }>(response);
      setSavedBracketId(entry.id);
      const leaderboardResponse = await fetch("/api/leaderboard");
      const payload = await readApi<LeaderboardPayload>(leaderboardResponse);
      setLeaderboard(payload.entries);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the demo bracket.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Shell>
      <Section className="bg-[#0b1712] pb-8 pt-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <StatusPill tone="cyan">Sample Dataset Mode</StatusPill>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Tournament Intelligence Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
              {notice}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Simulations
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {simulation.iterations.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Favorite
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {getTeamCode(simulation.probabilities[0]?.teamId ?? "")}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Final Pair
              </p>
              <p className="mt-2 text-sm font-semibold leading-6 text-white">
                {mostLikelyFinalA} vs {mostLikelyFinalB}
              </p>
            </Card>
          </div>
        </div>
      </Section>

      <Section className="py-6">
        <div className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.045] p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex h-11 min-w-fit items-center gap-2 rounded-md px-4 text-sm font-semibold transition ${
                  isActive
                    ? "bg-emerald-300 text-emerald-950"
                    : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
        {error ? (
          <div
            role="alert"
            className="mt-4 rounded-md border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100"
          >
            {error}
          </div>
        ) : null}
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: Trophy,
              label: "Most Likely Final",
              value: `${getTeamCode(simulation.mostLikelyFinal.teamAId)} vs ${getTeamCode(
                simulation.mostLikelyFinal.teamBId,
              )}`,
              detail: `${pct(simulation.mostLikelyFinal.probability)} of simulations`,
              tone: "cyan" as const,
            },
            {
              icon: Zap,
              label: "Dark Horse Detector",
              value: darkHorse,
              detail: `${pct(
                simulation.analytics.darkHorse.championProbability,
              )} champion path from ${simulation.analytics.darkHorse.seedRating} rating`,
              tone: "emerald" as const,
            },
            {
              icon: AlertTriangle,
              label: "Upset Risk",
              value: upsetTeam,
              detail: `${pct(
                simulation.analytics.upsetRisk.finalProbability,
              )} final probability, ${pct(
                simulation.analytics.upsetRisk.championProbability,
              )} title probability`,
              tone: "amber" as const,
            },
            {
              icon: Gauge,
              label: "Group Chaos Meter",
              value: pct(simulation.analytics.groupChaos.score),
              detail: simulation.analytics.groupChaos.note,
              tone: "rose" as const,
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    {item.label}
                  </p>
                  <span
                    className={`grid size-9 place-items-center rounded-md border ${
                      item.tone === "cyan"
                        ? "border-cyan-300/20 bg-cyan-300/10 text-cyan-200"
                        : item.tone === "emerald"
                          ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                          : item.tone === "amber"
                            ? "border-amber-300/20 bg-amber-300/10 text-amber-200"
                            : "border-rose-300/20 bg-rose-300/10 text-rose-200"
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 line-clamp-2 text-xl font-semibold text-white">
                  {item.value}
                </p>
                <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-400">
                  {item.detail}
                </p>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0">
        <motion.div
          key={activeTab}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
        >
          {activeTab === "groups" ? (
            <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {Object.entries(simulation.single.groupTables).map(
                  ([group, table]) => (
                    <Card key={group} className="overflow-hidden">
                      <div className="flex items-center justify-between border-b border-white/10 p-4">
                        <h2 className="text-lg font-semibold text-white">
                          Group {group}
                        </h2>
                        <RoundBadge>Projected</RoundBadge>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-left text-sm">
                          <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                            <tr>
                              <th className="px-4 py-3">Team</th>
                              <th className="px-2 py-3">Pts</th>
                              <th className="px-2 py-3">GD</th>
                              <th className="px-2 py-3">GF</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {table.map((row) => (
                              <tr
                                key={row.teamId}
                                className="border-t border-white/5 text-zinc-200"
                              >
                                <td className="px-4 py-3 font-medium text-white">
                                  {getTeamName(row.teamId)}
                                </td>
                                <td className="px-2 py-3">{row.points}</td>
                                <td className="px-2 py-3">
                                  {row.goalDifference > 0 ? "+" : ""}
                                  {row.goalDifference}
                                </td>
                                <td className="px-2 py-3">{row.goalsFor}</td>
                                <td className="px-4 py-3">
                                  <StatusPill tone={statusTone(row.status)}>
                                    {row.status}
                                  </StatusPill>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  ),
                )}
              </div>
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="size-5 text-amber-200" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-white">
                    Best Third-Place Teams
                  </h2>
                </div>
                <div className="mt-5 space-y-3">
                  {simulation.single.bestThirdPlace.map((row, index) => (
                    <div
                      key={row.teamId}
                      className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.04] p-3"
                    >
                      <div>
                        <p className="font-semibold text-white">
                          {index + 1}. {getTeamName(row.teamId)}
                        </p>
                        <p className="text-xs text-zinc-500">
                          Group {row.group} | {row.points} pts | GD{" "}
                          {row.goalDifference > 0 ? "+" : ""}
                          {row.goalDifference}
                        </p>
                      </div>
                      <StatusPill tone="amber">Bubble</StatusPill>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : null}

          {activeTab === "predictor" ? (
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="size-5 text-emerald-200" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-white">
                    Match Predictor
                  </h2>
                </div>
                <div className="mt-5 grid gap-4">
                  <SelectTeam
                    label="Team A"
                    value={teamAId}
                    teams={teams}
                    onChange={setTeamAId}
                  />
                  <SelectTeam
                    label="Team B"
                    value={teamBId}
                    teams={teams}
                    onChange={setTeamBId}
                  />
                  <button
                    type="button"
                    onClick={runPrediction}
                    disabled={isPredicting || teamAId === teamBId}
                    aria-busy={isPredicting}
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isPredicting ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <LineChart className="size-4" aria-hidden="true" />
                    )}
                    {isPredicting ? "Running..." : "Run prediction"}
                  </button>
                </div>
              </Card>
              <Card className="p-5">
                {prediction ? (
                  <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <StatusPill tone="emerald">
                          Confidence {pct(prediction.confidence)}
                        </StatusPill>
                        <StatusPill tone="cyan">
                          Rating gap {prediction.ratingGap}
                        </StatusPill>
                      </div>
                      <div className="mt-6 space-y-5">
                        {[
                          {
                            label: `${getTeamName(prediction.teamAId)} win`,
                            value: prediction.probabilities.teamAWin,
                          },
                          {
                            label: "Draw",
                            value: prediction.probabilities.draw,
                          },
                          {
                            label: `${getTeamName(prediction.teamBId)} win`,
                            value: prediction.probabilities.teamBWin,
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="font-medium text-zinc-200">
                                {item.label}
                              </span>
                              <span className="font-semibold text-white">
                                {pct(item.value)}
                              </span>
                            </div>
                            <ProbabilityBar value={item.value} />
                          </div>
                        ))}
                      </div>
                      <div className="mt-6 rounded-md border border-white/10 bg-black/20 p-4">
                        <p className="text-sm font-semibold text-white">
                          Why this prediction?
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                          {prediction.explanation.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ul>
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          {prediction.factors.map((factor) => (
                            <div
                              key={factor.label}
                              className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                {factor.label}
                              </p>
                              <p className="mt-1 font-semibold text-white">
                                {factor.value}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-zinc-500">
                                {factor.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                        Scoreline distribution
                      </h3>
                      <div className="mt-4 space-y-3">
                        {prediction.topScorelines.map((scoreline) => (
                          <div
                            key={`${scoreline.homeGoals}-${scoreline.awayGoals}`}
                            className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-white">
                                {scoreline.homeGoals}-{scoreline.awayGoals}
                              </span>
                              <span className="text-sm text-zinc-300">
                                {pct(scoreline.probability)}
                              </span>
                            </div>
                            <div className="mt-2">
                              <ProbabilityBar value={scoreline.probability} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-5 text-sm leading-6 text-zinc-500">
                        {prediction.uncertainty}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid min-h-[420px] place-items-center text-center">
                    <div>
                      <Sparkles className="mx-auto size-10 text-emerald-200" />
                      <p className="mt-4 text-lg font-semibold text-white">
                        Select two teams to generate an explainable prediction.
                      </p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ) : null}

          {activeTab === "simulator" ? (
            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-6">
                <Card className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-white">
                        Monte Carlo Simulator
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
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
                          className="inline-flex h-10 items-center gap-2 rounded-md border border-white/10 bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-55"
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
                  <div className="mt-5 h-[320px] min-h-[320px] min-w-0">
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
                    <p className="mt-1 text-sm text-zinc-500">
                      Top teams by title probability, with deep-run probabilities.
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
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
                        <p className="mt-1 text-xs text-zinc-500">
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
                  <p className="mt-1 text-sm text-zinc-500">
                    Single seeded tournament path from the latest simulation run.
                  </p>
                </div>
                <div className="grid gap-4 overflow-x-auto p-5 lg:grid-cols-3">
                  {simulation.single.bracket.map((round) => (
                    <div key={round.name} className="min-w-[260px]">
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
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
          ) : null}

          {activeTab === "teams" && focusTeam && focusProbability ? (
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
                  <p className="mt-1 text-sm text-zinc-500">
                    {focusTeam.confederation} | Group {focusTeam.group}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Rating
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {Math.round(focusRating?.rating ?? focusTeam.eloSeed)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Form
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {(focusRating?.form ?? focusTeam.form).toFixed(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Attack
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {(focusRating?.attack ?? focusTeam.attack).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                        Defense
                      </p>
                      <p className="mt-1 text-xl font-semibold text-white">
                        {(focusRating?.defense ?? focusTeam.defense).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/teams/${focusTeam.id}`}
                    className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
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
          ) : null}

          {activeTab === "leaderboard" ? (
            <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
              <Card className="p-5">
                <div className="flex items-center gap-3">
                  <Save className="size-5 text-emerald-200" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-white">
                    Prediction Game
                  </h2>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Demo Mode only. Saved entries and bracket links are temporary
                  until a database adapter is wired.
                </p>
                <div className="mt-5 grid gap-4">
                  <label>
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Display name
                    </span>
                    <input
                      value={playerName}
                      onChange={(event) => setPlayerName(event.target.value)}
                      className="h-12 w-full rounded-md border border-white/10 bg-[#0d1a15] px-3 text-sm text-white outline-none"
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
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-55"
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
                    Public Leaderboard
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left text-sm">
                    <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
                      <tr>
                        <th className="px-5 py-3">Rank</th>
                        <th className="px-5 py-3">User</th>
                        <th className="px-5 py-3">Champion</th>
                        <th className="px-5 py-3">Finalist</th>
                        <th className="px-5 py-3">Score</th>
                      </tr>
                    </thead>
                    <tbody>
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
          ) : null}
        </motion.div>
      </Section>
    </Shell>
  );
}
