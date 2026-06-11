import { DATASET_MODE } from "@/lib/data";
import { getLiveResolvedMatches } from "@/lib/calibration/live-results-service";
import type { LeaderboardEntry } from "@/lib/types";
import type {
  BracketRepository,
  BracketSubmission,
  LeaderboardRepository,
  ResolvedMatchRepository,
  SimulationRepository,
} from "@/lib/repositories/contracts";

const demoEntries: LeaderboardEntry[] = [
  {
    id: "demo-1",
    name: "Model Baseline",
    championTeamId: "argentina",
    finalistTeamId: "france",
    score: 84,
    createdAt: "2026-06-01T10:00:00.000Z",
    mode: DATASET_MODE,
  },
  {
    id: "demo-2",
    name: "Upset Hunter",
    championTeamId: "spain",
    finalistTeamId: "brazil",
    score: 78,
    createdAt: "2026-06-02T15:30:00.000Z",
    mode: DATASET_MODE,
  },
  {
    id: "demo-3",
    name: "Bracket Lab",
    championTeamId: "england",
    finalistTeamId: "portugal",
    score: 71,
    createdAt: "2026-06-04T18:10:00.000Z",
    mode: DATASET_MODE,
  },
  {
    id: "demo-4",
    name: "Dark Horse Believer",
    championTeamId: "morocco",
    finalistTeamId: "portugal",
    score: 63,
    createdAt: "2026-06-05T12:00:00.000Z",
    mode: DATASET_MODE,
  },
];

const globalStore = globalThis as typeof globalThis & {
  worldCupOracleLeaderboard?: LeaderboardEntry[];
};

function getStore(): LeaderboardEntry[] {
  if (!globalStore.worldCupOracleLeaderboard) {
    globalStore.worldCupOracleLeaderboard = [...demoEntries];
  }

  return globalStore.worldCupOracleLeaderboard;
}

function createDemoScore(championTeamId: string, finalistTeamId?: string): number {
  const championBonus = championTeamId.length % 11;
  const finalistBonus = finalistTeamId ? finalistTeamId.length % 9 : 0;
  return 52 + championBonus * 3 + finalistBonus * 2;
}

export const inMemoryLeaderboardRepository: LeaderboardRepository = {
  async list() {
    return [...getStore()].sort((left, right) => right.score - left.score);
  },

  async saveDemoBracket(input: BracketSubmission) {
    const entry: LeaderboardEntry = {
      id: `demo-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: input.name,
      championTeamId: input.championTeamId,
      finalistTeamId: input.finalistTeamId,
      score: createDemoScore(input.championTeamId, input.finalistTeamId),
      createdAt: new Date().toISOString(),
      mode: DATASET_MODE,
    };

    getStore().push(entry);
    return entry;
  },
};

export const inMemoryBracketRepository: BracketRepository = {
  save(input) {
    return inMemoryLeaderboardRepository.saveDemoBracket(input);
  },
};

export const inMemorySimulationRepository: SimulationRepository = {
  async saveRun() {
    // Demo adapter intentionally does not persist simulation runs.
  },
  async saveSinglePath() {
    // Demo adapter intentionally does not persist bracket paths.
  },
};

export const inMemoryResolvedMatchRepository: ResolvedMatchRepository = {
  async list() {
    // REAL resolved matches graded from the live football-data.org feed (cached).
    // Empty until the tournament produces FINISHED matches, or when no live
    // provider key is configured. The calibration layer falls back to the
    // clearly-labeled synthetic illustration in that case — the two are never
    // mixed.
    return getLiveResolvedMatches();
  },
};
