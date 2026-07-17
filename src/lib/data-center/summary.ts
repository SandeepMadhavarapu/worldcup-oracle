import {
  DATASET_MODE,
  DATASET_NOTICE,
  WORLD_CUP_2026_DATASET_MODE,
  WORLD_CUP_2026_DATASET_NOTICE,
  getProviderMode,
  getProviderNotice,
  getTeamName,
  getWorldCup2026Dataset,
  teamById,
  teams,
} from "@/lib/data";
import { matchBrier } from "@/lib/calibration/calibration";
import { getCalibrationSource } from "@/lib/calibration/server";
import type { CalibrationSource } from "@/lib/calibration/source";
import type { ResolvedMatch } from "@/lib/calibration/types";
import { getLiveScores } from "@/lib/live/service";
import type { LiveScoresPayload } from "@/lib/live/types";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { predictMatch } from "@/lib/prediction/match";
import { getBaselineSimulation } from "@/lib/tournament/baseline";
import type { ProviderMode, TeamRating } from "@/lib/types";

export type SourceKind =
  | "live"
  | "sample"
  | "offline"
  | "demo"
  | "placeholder"
  | "illustrative";

export interface ProviderConnectionStatus {
  selectedProvider: "none" | "football-data" | "unknown";
  footballDataConnected: boolean;
  liveProviderAvailable: boolean;
}

export interface DataSourceStatusItem {
  label: string;
  value: string;
  detail: string;
  sourceKind: SourceKind;
}

export interface TeamDataRow {
  team: string;
  code: string;
  group: string;
  rating: string;
  attack: string;
  defense: string;
  form: string;
  sourceLabel: string;
  sourceKind: SourceKind;
}

export interface FixtureDataRow {
  match: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  venue: string;
  status: string;
  score: string;
  sourceLabel: string;
  sourceKind: SourceKind;
}

export interface LiveResultRow {
  match: string;
  kickoff: string;
  homeTeam: string;
  awayTeam: string;
  stage: string;
  status: string;
  score: string;
  sourceLabel: string;
  lastUpdated: string;
  sourceKind: SourceKind;
}

export interface ModelInputRow {
  team: string;
  rating: string;
  attack: string;
  defense: string;
  form: string;
  modelVersion: string;
  assumptions: string;
}

export interface PredictionOutputRow {
  match: string;
  homeWin: string;
  draw: string;
  awayWin: string;
  mostLikelyScore: string;
  confidence: string;
  topFactors: string;
  modelVersion: string;
}

export interface SimulationSummaryRow {
  team: string;
  champion: string;
  final: string;
  semifinal: string;
  quarterfinal: string;
  advancement: string;
  tags: string;
  simulationCount: string;
  seed: string;
  modelVersion: string;
}

export interface CalibrationEvidenceRow {
  match: string;
  kickoff: string;
  predicted: string;
  predictedPick: string;
  actual: string;
  brier: string;
  sourceLabel: string;
  sourceKind: SourceKind;
}

export interface PersistenceStatus {
  leaderboardMode: string;
  bracketStorageMode: string;
  resetLimitation: string;
  durableStorage: string;
  publicBetaNeeds: string[];
}

export interface FixtureFreshnessStatus {
  headline: string;
  detail: string;
  curatedFixtureCount: number;
  completedCuratedResultCount: number;
  placeholderCount: number;
  liveProviderRowCount: number;
  staticDatasetIncomplete: boolean;
  liveProviderAvailable: boolean;
  sourceKind: SourceKind;
}

export interface DataCenterSnapshot {
  providerMode: ProviderMode;
  providerNotice: string;
  providerStatus: ProviderConnectionStatus;
  liveScores: LiveScoresPayload;
  calibrationSource: CalibrationSource;
  fixtureFreshness: FixtureFreshnessStatus;
  statusItems: DataSourceStatusItem[];
  teams: TeamDataRow[];
  fixtures: FixtureDataRow[];
  liveResults: LiveResultRow[];
  liveEmptyReason: string | null;
  modelInputs: ModelInputRow[];
  predictions: PredictionOutputRow[];
  simulations: SimulationSummaryRow[];
  calibrationEvidence: CalibrationEvidenceRow[];
  persistence: PersistenceStatus;
}

type ProviderEnv = Partial<
  Record<
    "LIVE_DATA_PROVIDER" | "FOOTBALL_DATA_API_KEY",
    string
  >
>;

const MODEL_ASSUMPTIONS =
  "Sample historical rows, neutral venue, no lineup/injury feed, educational estimate only.";
const EXPECTED_WORLD_CUP_2026_MATCH_COUNT = 104;

const PREDICTION_SAMPLE_PAIRS: Array<[string, string]> = [
  ["mexico", "south-africa"],
  ["argentina", "denmark"],
  ["spain", "uruguay"],
  ["france", "canada"],
  ["brazil", "croatia"],
  ["england", "senegal"],
  ["germany", "mexico"],
  ["portugal", "netherlands"],
];

function boolLabel(value: boolean): string {
  return value ? "Connected" : "Not connected";
}

function titleCaseMode(value: string): string {
  return value
    .toLowerCase()
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "Not available";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toISOString().replace(".000Z", "Z");
}

function configuredProvider(env: ProviderEnv): ProviderConnectionStatus["selectedProvider"] {
  const provider = env.LIVE_DATA_PROVIDER;

  if (!provider || provider === "none") {
    return "none";
  }

  if (provider === "football-data") {
    return provider;
  }

  return "unknown";
}

export function buildProviderConnectionStatus(
  env: ProviderEnv = {
    LIVE_DATA_PROVIDER: process.env.LIVE_DATA_PROVIDER,
    FOOTBALL_DATA_API_KEY: process.env.FOOTBALL_DATA_API_KEY,
  },
): ProviderConnectionStatus {
  const selectedProvider = configuredProvider(env);
  const footballDataConnected =
    selectedProvider === "football-data" && Boolean(env.FOOTBALL_DATA_API_KEY);
  return {
    selectedProvider,
    footballDataConnected,
    liveProviderAvailable: footballDataConnected,
  };
}

function sourceKindForProvider(providerMode: ProviderMode): SourceKind {
  if (providerMode === "LIVE_PROVIDER_MODE") {
    return "live";
  }

  if (providerMode === "OFFLINE_DATASET_MODE") {
    return "offline";
  }

  return "sample";
}

function buildStatusItems(
  providerMode: ProviderMode,
  providerStatus: ProviderConnectionStatus,
  liveScores: LiveScoresPayload,
): DataSourceStatusItem[] {
  const liveAvailable = liveScores.status === "available";

  return [
    {
      label: "Dataset mode",
      value: titleCaseMode(DATASET_MODE),
      detail: DATASET_NOTICE,
      sourceKind: "sample",
    },
    {
      label: "Provider mode",
      value: titleCaseMode(providerMode),
      detail: getProviderNotice(),
      sourceKind: sourceKindForProvider(providerMode),
    },
    {
      label: "Live provider availability",
      value: liveAvailable ? "Available" : "Unavailable",
      detail: liveAvailable
        ? `${liveScores.matches.length} provider matches returned.`
        : liveScores.reason ?? "No live provider response is available.",
      sourceKind: liveAvailable ? "live" : sourceKindForProvider(providerMode),
    },
    {
      label: "football-data connection",
      value: boolLabel(providerStatus.footballDataConnected),
      detail:
        providerStatus.selectedProvider === "football-data"
          ? "football-data.org is the configured live-score provider."
          : "football-data.org is not selected for this runtime.",
      sourceKind: providerStatus.footballDataConnected ? "live" : "offline",
    },
    {
      label: "Last live check",
      value: formatDateTime(liveScores.fetchedAt),
      detail: liveAvailable
        ? "Timestamp from the cached live-score provider response."
        : "Last time the read-only live-score cache evaluated provider state.",
      sourceKind: liveAvailable ? "live" : "offline",
    },
    {
      label: "Demo persistence",
      value: "In-memory",
      detail:
        "Saved brackets and leaderboard entries reset on cold starts until Postgres is configured.",
      sourceKind: "demo",
    },
  ];
}

function ratingRows(ratings: Map<string, TeamRating>): TeamDataRow[] {
  return teams.map((team) => {
    const rating = ratings.get(team.id);

    return {
      team: team.name,
      code: team.code,
      group: team.group,
      rating: Math.round(rating?.rating ?? team.eloSeed).toLocaleString(),
      attack: (rating?.attack ?? team.attack).toFixed(2),
      defense: (rating?.defense ?? team.defense).toFixed(2),
      form: (rating?.form ?? team.form).toFixed(1),
      sourceLabel: "Sample team seed plus local historical importer",
      sourceKind: "sample",
    };
  });
}

function teamOrPlaceholderLabel(value: string): string {
  const team = teamById.get(value);
  if (team) {
    return team.name;
  }

  if (value.startsWith("winner-match-")) {
    return `Winner of match ${value.replace("winner-match-", "")}`;
  }

  return value;
}

function fixtureHasCompletedResult(fixture: {
  status: string;
  homeGoals?: number;
  awayGoals?: number;
}): boolean {
  return (
    fixture.status === "completed" &&
    Number.isFinite(fixture.homeGoals) &&
    Number.isFinite(fixture.awayGoals)
  );
}

function staticPlaceholderCount(): number {
  const dataset = getWorldCup2026Dataset();
  const groupPlaceholders = dataset.groups
    .flatMap((group) => group.teams)
    .filter((team) => team.status === "official-data-ready-placeholder").length;
  const fixtureParticipantPlaceholders = dataset.fixtures.reduce(
    (count, fixture) =>
      count +
      (teamById.has(fixture.homeTeam) ? 0 : 1) +
      (teamById.has(fixture.awayTeam) ? 0 : 1),
    0,
  );

  return groupPlaceholders + fixtureParticipantPlaceholders;
}

export function buildFixtureFreshnessStatus(
  liveScores: LiveScoresPayload,
): FixtureFreshnessStatus {
  const dataset = getWorldCup2026Dataset();
  const curatedFixtureCount = dataset.fixtures.length;
  const completedCuratedResultCount = dataset.fixtures.filter(
    fixtureHasCompletedResult,
  ).length;
  const placeholderCount = staticPlaceholderCount();
  const liveProviderRowCount =
    liveScores.status === "available" ? liveScores.matches.length : 0;
  const staticDatasetIncomplete =
    curatedFixtureCount < EXPECTED_WORLD_CUP_2026_MATCH_COUNT ||
    placeholderCount > 0;
  const liveProviderAvailable = liveScores.status === "available";

  if (liveProviderAvailable) {
    return {
      headline: "Live provider connected",
      detail: `${liveProviderRowCount.toLocaleString()} provider rows are available. The curated static layer has ${curatedFixtureCount.toLocaleString()} fixtures, ${completedCuratedResultCount.toLocaleString()} completed results, and ${
        staticDatasetIncomplete
          ? "is still an incomplete official fixture set."
          : "covers the expected official fixture set."
      }`,
      curatedFixtureCount,
      completedCuratedResultCount,
      placeholderCount,
      liveProviderRowCount,
      staticDatasetIncomplete,
      liveProviderAvailable,
      sourceKind: "live",
    };
  }

  return {
    headline: staticDatasetIncomplete
      ? "Curated static seed - incomplete official fixture set"
      : "Curated static fixture set",
    detail: `Provider unavailable; showing sample/curated rows only. The static layer has ${curatedFixtureCount.toLocaleString()} curated fixtures, ${completedCuratedResultCount.toLocaleString()} completed results, and ${placeholderCount.toLocaleString()} placeholder team or slot entries.`,
    curatedFixtureCount,
    completedCuratedResultCount,
    placeholderCount,
    liveProviderRowCount,
    staticDatasetIncomplete,
    liveProviderAvailable,
    sourceKind: "sample",
  };
}

function fixtureRows(): FixtureDataRow[] {
  return getWorldCup2026Dataset().fixtures.map((fixture) => {
    const hasPlaceholderTeam =
      !teamById.has(fixture.homeTeam) || !teamById.has(fixture.awayTeam);
    const hasCompletedResult = fixtureHasCompletedResult(fixture);

    return {
      match: `M${fixture.matchNumber}`,
      kickoff: formatDateTime(fixture.kickoffTimeLocal),
      homeTeam: teamOrPlaceholderLabel(fixture.homeTeam),
      awayTeam: teamOrPlaceholderLabel(fixture.awayTeam),
      stage: fixture.group ? `${fixture.stage} - Group ${fixture.group}` : fixture.stage,
      venue: `${fixture.venue}, ${fixture.hostCity}`,
      status: titleCaseMode(fixture.status),
      score: hasCompletedResult
        ? `${fixture.homeGoals}-${fixture.awayGoals}`
        : "Not available",
      sourceLabel:
        hasCompletedResult && fixture.resultSourceLabel
          ? fixture.resultSourceLabel
          : hasPlaceholderTeam
            ? "Manual public fixture seed with bracket placeholders"
            : "Manual public fixture seed",
      sourceKind: hasPlaceholderTeam ? "placeholder" : "sample",
    };
  });
}

function liveResultRows(liveScores: LiveScoresPayload): LiveResultRow[] {
  if (liveScores.status !== "available") {
    return [];
  }

  return liveScores.matches.map((match) => ({
    match: match.id,
    kickoff: formatDateTime(match.utcDate),
    homeTeam: match.homeName,
    awayTeam: match.awayName,
    stage: match.stage ?? "Not provided",
    status: titleCaseMode(match.status),
    score:
      match.homeScore === null || match.awayScore === null
        ? "Not available"
        : `${match.homeScore}-${match.awayScore}`,
    sourceLabel: "football-data.org normalized provider response",
    lastUpdated: formatDateTime(liveScores.fetchedAt),
    sourceKind: "live",
  }));
}

export function buildModelInputRows(
  ratings: Map<string, TeamRating>,
  modelVersion: string,
): ModelInputRow[] {
  return teams.map((team) => {
    const rating = ratings.get(team.id);

    return {
      team: team.name,
      rating: Math.round(rating?.rating ?? team.eloSeed).toLocaleString(),
      attack: (rating?.attack ?? team.attack).toFixed(2),
      defense: (rating?.defense ?? team.defense).toFixed(2),
      form: (rating?.form ?? team.form).toFixed(1),
      modelVersion,
      assumptions: MODEL_ASSUMPTIONS,
    };
  });
}

export function buildPredictionOutputRows(
  ratings: Map<string, TeamRating>,
  modelVersion: string,
): PredictionOutputRow[] {
  return PREDICTION_SAMPLE_PAIRS.map(([homeTeamId, awayTeamId]) => {
    const prediction = predictMatch(homeTeamId, awayTeamId, ratings);
    const topScoreline = prediction.topScorelines[0];

    return {
      match: `${getTeamName(homeTeamId)} vs ${getTeamName(awayTeamId)}`,
      homeWin: formatPercent(prediction.probabilities.teamAWin),
      draw: formatPercent(prediction.probabilities.draw),
      awayWin: formatPercent(prediction.probabilities.teamBWin),
      mostLikelyScore: topScoreline
        ? `${topScoreline.homeGoals}-${topScoreline.awayGoals}`
        : "Not available",
      confidence: formatPercent(prediction.confidence),
      topFactors: prediction.factors
        .slice(0, 3)
        .map((factor) => `${factor.label}: ${factor.value}`)
        .join("; "),
      modelVersion,
    };
  });
}

function simulationRows(
  simulation: ReturnType<typeof getBaselineSimulation>,
): SimulationSummaryRow[] {
  const qualification = new Map(
    simulation.qualificationProbabilities.map((row) => [row.teamId, row]),
  );

  return simulation.probabilities.map((row) => {
    const tags = [
      row.teamId === simulation.analytics.darkHorse.teamId ? "Dark horse" : null,
      row.teamId === simulation.analytics.upsetRisk.teamId ? "Upset risk" : null,
      row.teamId === simulation.probabilities[0]?.teamId ? "Favorite" : null,
    ].filter(Boolean);

    return {
      team: getTeamName(row.teamId),
      champion: formatPercent(row.champion),
      final: formatPercent(row.final),
      semifinal: formatPercent(row.semiFinal),
      quarterfinal: formatPercent(row.quarterFinal),
      advancement: formatPercent(
        qualification.get(row.teamId)?.groupAdvance ?? row.roundOf32,
      ),
      tags: tags.length > 0 ? tags.join(", ") : "None",
      simulationCount: simulation.iterations.toLocaleString(),
      seed: simulation.metadata.seed,
      modelVersion: simulation.metadata.modelVersion,
    };
  });
}

function outcomeLabel(outcome: ResolvedMatch["actual"]): string {
  if (outcome === "win") {
    return "Home win";
  }

  if (outcome === "draw") {
    return "Draw";
  }

  return "Away win";
}

function predictedPick(match: ResolvedMatch): string {
  const entries = [
    ["Home win", match.predicted.win] as const,
    ["Draw", match.predicted.draw] as const,
    ["Away win", match.predicted.loss] as const,
  ].sort((left, right) => right[1] - left[1]);

  return `${entries[0][0]} (${formatPercent(entries[0][1])})`;
}

export function buildCalibrationEvidenceRows(
  source: CalibrationSource,
): CalibrationEvidenceRow[] {
  return source.matches.map((match) => ({
    match: `${getTeamName(match.homeTeamId)} vs ${getTeamName(match.awayTeamId)}`,
    kickoff: formatDateTime(match.kickoff),
    predicted: `H ${formatPercent(match.predicted.win)} / D ${formatPercent(
      match.predicted.draw,
    )} / A ${formatPercent(match.predicted.loss)}`,
    predictedPick: predictedPick(match),
    actual: outcomeLabel(match.actual),
    brier: matchBrier(match).toFixed(3),
    sourceLabel: source.isLive
      ? "Live resolved provider result"
      : "Illustrative synthetic calibration row",
    sourceKind: source.isLive ? "live" : "illustrative",
  }));
}

export function buildPersistenceStatus(): PersistenceStatus {
  return {
    leaderboardMode: "Demo placeholder leaderboard",
    bracketStorageMode: "In-memory repository",
    resetLimitation:
      "Saved brackets and shared links reset on cold starts, redeploys, or process replacement.",
    durableStorage: "Not configured",
    publicBetaNeeds: [
      "Postgres or Supabase persistence",
      "Redis, Vercel KV, or Upstash for shared rate limiting",
      "Authentication and user-owned bracket history",
      "Monitoring, abuse controls, backup, and restore workflow",
    ],
  };
}

export async function getDataCenterSnapshot(): Promise<DataCenterSnapshot> {
  const liveScoresPromise = getLiveScores();
  const calibrationSourcePromise = getCalibrationSource();
  const ratings = buildTeamRatings();
  const simulation = getBaselineSimulation();
  const [liveScores, calibrationSource] = await Promise.all([
    liveScoresPromise,
    calibrationSourcePromise,
  ]);
  const providerMode = getProviderMode();
  const providerStatus = buildProviderConnectionStatus();

  return {
    providerMode,
    providerNotice: getProviderNotice(),
    providerStatus,
    liveScores,
    calibrationSource,
    fixtureFreshness: buildFixtureFreshnessStatus(liveScores),
    statusItems: buildStatusItems(providerMode, providerStatus, liveScores),
    teams: ratingRows(ratings),
    fixtures: fixtureRows(),
    liveResults: liveResultRows(liveScores),
    liveEmptyReason:
      liveScores.status === "available"
        ? liveScores.matches.length === 0
          ? "The provider is connected, but returned no matches for the current World Cup window."
          : null
        : liveScores.reason ?? "No live provider response is available.",
    modelInputs: buildModelInputRows(ratings, simulation.metadata.modelVersion),
    predictions: buildPredictionOutputRows(
      ratings,
      simulation.metadata.modelVersion,
    ),
    simulations: simulationRows(simulation),
    calibrationEvidence: buildCalibrationEvidenceRows(calibrationSource),
    persistence: buildPersistenceStatus(),
  };
}

export const DATA_CENTER_DATASET_MODE = DATASET_MODE;
export const DATA_CENTER_DATASET_NOTICE = DATASET_NOTICE;
export const DATA_CENTER_TOURNAMENT_DATASET_MODE = WORLD_CUP_2026_DATASET_MODE;
export const DATA_CENTER_TOURNAMENT_DATASET_NOTICE =
  WORLD_CUP_2026_DATASET_NOTICE;
