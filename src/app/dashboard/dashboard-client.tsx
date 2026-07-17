"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Dices,
  Gauge,
  Medal,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import {
  DataTable,
  DatasetModeBadge,
  SourceBadge,
  type DataTableColumn,
} from "@/components/data-center";
import { Card, Section, Shell, StatusPill } from "@/components/ui";
import type {
  LeaderboardEntry,
  MatchPrediction,
  Team,
  TeamRating,
  TournamentSimulationSummary,
} from "@/lib/types";
import { GroupsTab } from "./tabs/groups-tab";
import { LeaderboardTab } from "./tabs/leaderboard-tab";
import { PredictorTab } from "./tabs/predictor-tab";
import { SimulatorTab } from "./tabs/simulator-tab";
import { TeamsTab } from "./tabs/teams-tab";
import { pct, readApi } from "./tabs/shared";

type TabId = "groups" | "predictor" | "simulator" | "teams" | "leaderboard";

interface DashboardClientProps {
  teams: Team[];
  ratings: TeamRating[];
  initialSimulation: TournamentSimulationSummary;
  initialLeaderboard: LeaderboardEntry[];
  notice: string;
  datasetMode: string;
  providerMode: string;
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

interface DashboardSimulationRow {
  team: string;
  champion: string;
  final: string;
  semifinal: string;
}

const dashboardSimulationColumns: Array<DataTableColumn<DashboardSimulationRow>> = [
  { key: "team", header: "Team", render: (row) => row.team },
  { key: "champion", header: "Champion", render: (row) => row.champion },
  { key: "final", header: "Final", render: (row) => row.final },
  { key: "semifinal", header: "Semifinal", render: (row) => row.semifinal },
];

export function DashboardClient({
  teams,
  ratings,
  initialSimulation,
  initialLeaderboard,
  notice,
  datasetMode,
  providerMode,
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
  const tabListRef = useRef<HTMLDivElement>(null);

  // Roving-focus keyboard support for the tablist (WAI-ARIA tabs pattern):
  // arrow keys move and activate, Home/End jump to the ends.
  function focusTabAt(index: number) {
    const count = tabs.length;
    const nextIndex = (index + count) % count;
    setActiveTab(tabs[nextIndex].id);
    const buttons =
      tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[nextIndex]?.focus();
  }

  function onTabKeyDown(event: React.KeyboardEvent, index: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        focusTabAt(index + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        focusTabAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTabAt(0);
        break;
      case "End":
        event.preventDefault();
        focusTabAt(tabs.length - 1);
        break;
      default:
        break;
    }
  }

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
  const providerKind =
    providerMode === "LIVE_PROVIDER_MODE"
      ? "live"
      : providerMode === "OFFLINE_DATASET_MODE"
        ? "offline"
        : "sample";
  const topSimulationRows = simulation.probabilities.slice(0, 6).map((row) => ({
    team: teamMap.get(row.teamId)?.name ?? row.teamId,
    champion: pct(row.champion),
    final: pct(row.final),
    semifinal: pct(row.semiFinal),
  }));

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
            <StatusPill tone="cyan">Dashboard Projection Mode</StatusPill>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              Tournament Intelligence Dashboard
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
              {notice}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Simulations
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {simulation.iterations.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Favorite
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {getTeamCode(simulation.probabilities[0]?.teamId ?? "")}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
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
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Dashboard views"
          aria-orientation="horizontal"
          className="flex gap-2 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.045] p-2"
        >
          {tabs.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
                className={`flex h-11 min-w-fit items-center gap-2 rounded-md px-4 text-sm font-semibold transition active:scale-[0.98] motion-reduce:active:scale-100 ${
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
        <div className="mt-6 grid gap-4 lg:grid-cols-[360px_1fr]">
          <Card className="p-5">
            <div className="flex flex-wrap gap-2">
              <DatasetModeBadge mode={datasetMode} kind="sample" />
              <DatasetModeBadge mode={providerMode} kind={providerKind} />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              Dashboard projections use sample model inputs and the current
              simulation state. Saved leaderboard entries are demo persistence.
            </p>
            <div className="mt-4">
              <SourceBadge kind="demo">In-memory leaderboard</SourceBadge>
            </div>
          </Card>
          <DataTable
            title="Top Simulation Snapshot"
            description="Read-only summary from the active dashboard simulation; no extra simulation pass is run."
            columns={dashboardSimulationColumns}
            rows={topSimulationRows}
            getRowKey={(row) => row.team}
            minWidth="560px"
          />
        </div>
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
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
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
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.25 }}
          className="rounded-lg"
        >
          {activeTab === "groups" ? (
            <GroupsTab simulation={simulation} getTeamName={getTeamName} />
          ) : null}

          {activeTab === "predictor" ? (
            <PredictorTab
              teams={teams}
              teamAId={teamAId}
              teamBId={teamBId}
              setTeamAId={setTeamAId}
              setTeamBId={setTeamBId}
              prediction={prediction}
              isPredicting={isPredicting}
              runPrediction={runPrediction}
              getTeamName={getTeamName}
            />
          ) : null}

          {activeTab === "simulator" ? (
            <SimulatorTab
              simulation={simulation}
              championData={championData}
              isSimulating={isSimulating}
              isPending={isPending}
              runSimulation={runSimulation}
              getTeamName={getTeamName}
            />
          ) : null}

          {activeTab === "teams" && focusTeam && focusProbability ? (
            <TeamsTab
              teams={teams}
              teamFocusId={teamFocusId}
              setTeamFocusId={setTeamFocusId}
              focusTeam={focusTeam}
              focusRating={focusRating}
              focusProbability={focusProbability}
            />
          ) : null}

          {activeTab === "leaderboard" ? (
            <LeaderboardTab
              teams={teams}
              playerName={playerName}
              setPlayerName={setPlayerName}
              championPick={championPick}
              setChampionPick={setChampionPick}
              finalistPick={finalistPick}
              setFinalistPick={setFinalistPick}
              isSaving={isSaving}
              saveBracket={saveBracket}
              savedBracketId={savedBracketId}
              leaderboard={leaderboard}
              getTeamName={getTeamName}
            />
          ) : null}
        </motion.div>
      </Section>
    </Shell>
  );
}
