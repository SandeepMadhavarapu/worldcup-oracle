export const GROUP_CODES = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
] as const;

export type GroupCode = (typeof GROUP_CODES)[number];

export type Confederation =
  | "AFC"
  | "CAF"
  | "CONCACAF"
  | "CONMEBOL"
  | "OFC"
  | "UEFA";

export type CompetitionType =
  | "world_cup"
  | "continental"
  | "qualifier"
  | "friendly";

export type DatasetMode = "sample";

export type ProviderMode =
  | "SAMPLE_DATASET_MODE"
  | "OFFLINE_DATASET_MODE"
  | "LIVE_PROVIDER_MODE";

export interface ApiMeta {
  requestId: string;
  datasetMode: DatasetMode;
  providerMode: ProviderMode;
  generatedAt: string;
}

export interface ApiSuccess<T> {
  ok: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiFailure {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface Team {
  id: string;
  name: string;
  code: string;
  confederation: Confederation;
  group: GroupCode;
  eloSeed: number;
  attack: number;
  defense: number;
  form: number;
  worldCupPedigree: number;
  accent: string;
}

export interface HistoricalMatch {
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  neutral: boolean;
  competition: CompetitionType;
}

export interface TeamRating {
  teamId: string;
  rating: number;
  attack: number;
  defense: number;
  form: number;
  matches: number;
}

export interface ScorelineProbability {
  homeGoals: number;
  awayGoals: number;
  probability: number;
}

export interface MatchPrediction {
  teamAId: string;
  teamBId: string;
  favoredTeamId: string;
  probabilities: {
    teamAWin: number;
    draw: number;
    teamBWin: number;
  };
  expectedGoals: {
    teamA: number;
    teamB: number;
  };
  topScorelines: ScorelineProbability[];
  confidence: number;
  ratingGap: number;
  formSignal: number;
  attackDefenseSignal: number;
  explanation: string[];
  factors: {
    label: string;
    value: number;
    impact: "teamA" | "teamB" | "neutral";
    note: string;
  }[];
  uncertainty: string;
  limitations: string[];
}

export type QualificationStatus =
  | "qualified"
  | "third-place bubble"
  | "eliminated"
  | "pending";

export interface StandingRow {
  teamId: string;
  group: GroupCode;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  status: QualificationStatus;
}

export interface SimulatedMatch {
  id: string;
  stage: string;
  group?: GroupCode;
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  winnerTeamId?: string;
  wentToPenalties?: boolean;
}

export interface KnockoutRound {
  name:
    | "Round of 32"
    | "Round of 16"
    | "Quarter-finals"
    | "Semi-finals"
    | "Third-place"
    | "Final";
  matches: SimulatedMatch[];
}

export interface BracketResolutionMetadata {
  isApproximation: boolean;
  thirdPlaceCompatibilityApplied: boolean;
  sameGroupRematchesAvoided: number;
  unresolvedSameGroupRematches: number;
  warning?: string;
}

export interface SingleTournamentSimulation {
  groupTables: Record<GroupCode, StandingRow[]>;
  bestThirdPlace: StandingRow[];
  eliminatedThirdPlace: StandingRow[];
  bracket: KnockoutRound[];
  bracketResolution: BracketResolutionMetadata;
  championTeamId: string;
  runnerUpTeamId: string;
  thirdPlaceTeamId: string;
}

export interface TeamRoundProbability {
  teamId: string;
  roundOf32: number;
  roundOf16: number;
  quarterFinal: number;
  semiFinal: number;
  final: number;
  champion: number;
}

export interface TitleRunStep {
  round: KnockoutRound["name"];
  opponentTeamId: string;
}

export interface TeamTitlePath {
  teamId: string;
  /** Number of simulations this team won the title. */
  titleCount: number;
  /** titleCount / iterations. */
  championProbability: number;
  /** The most frequent sequence of opponents beaten across title runs. */
  modalPath: TitleRunStep[];
  /** Simulations whose title run followed the modal path. */
  modalCount: number;
  /** modalCount / titleCount. */
  modalShare: number;
}

export interface TeamQualificationProbability {
  teamId: string;
  topTwo: number;
  thirdPlace: number;
  bestThirdPlace: number;
  groupAdvance: number;
}

export interface TournamentSimulationSummary {
  datasetMode: DatasetMode;
  iterations: number;
  metadata: {
    simulationCount: number;
    seed: string;
    datasetMode: DatasetMode;
    generatedAt: string;
    modelVersion: string;
    bracketResolution: BracketResolutionMetadata;
  };
  teams: Team[];
  probabilities: TeamRoundProbability[];
  qualificationProbabilities: TeamQualificationProbability[];
  /** Modal title runs per team; only populated when collectTitlePaths is set. */
  titlePaths?: TeamTitlePath[];
  single: SingleTournamentSimulation;
  mostLikelyFinal: {
    teamAId: string;
    teamBId: string;
    probability: number;
  };
  analytics: {
    darkHorse: {
      teamId: string;
      championProbability: number;
      seedRating: number;
    };
    upsetRisk: {
      teamId: string;
      championProbability: number;
      finalProbability: number;
    };
    groupChaos: {
      score: number;
      note: string;
    };
    modelConfidence: {
      score: number;
      note: string;
    };
  };
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  championTeamId: string;
  finalistTeamId?: string;
  score: number;
  createdAt: string;
  mode: DatasetMode;
}
