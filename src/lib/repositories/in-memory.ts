import { randomUUID } from "node:crypto";

import { DATASET_MODE } from "@/lib/data";
import { getLiveResolvedMatches } from "@/lib/calibration/live-results-service";
import { getBaselineSimulation } from "@/lib/tournament/baseline";
import type { LeaderboardEntry } from "@/lib/types";
import type {
  BracketSubmission,
  LeaderboardRepository,
  ResolvedMatchRepository,
} from "@/lib/repositories/contracts";

// Hard cap so a public deployment cannot grow this store without bound. When
// the cap is reached the OLDEST entry is evicted (FIFO): the leaderboard is a
// demo, and honest recency beats hoarding.
const MAX_LEADERBOARD_ENTRIES = 500;

// Identical submissions inside this window return the existing entry instead
// of creating a duplicate — double-clicks and retried requests stay idempotent.
const DUPLICATE_WINDOW_MS = 30_000;

const globalStore = globalThis as typeof globalThis & {
  worldCupOracleLeaderboard?: LeaderboardEntry[];
};

function getStore(): LeaderboardEntry[] {
  if (!globalStore.worldCupOracleLeaderboard) {
    // Starts EMPTY. No fabricated seed entries: an empty demo leaderboard is
    // honest; invented "users" are not.
    globalStore.worldCupOracleLeaderboard = [];
  }

  return globalStore.worldCupOracleLeaderboard;
}

export function createModelDemoScore(
  championTeamId: string,
  finalistTeamId?: string,
): number {
  const probabilities = getBaselineSimulation().probabilities;
  const champion = probabilities.find((row) => row.teamId === championTeamId);
  const finalist = finalistTeamId
    ? probabilities.find((row) => row.teamId === finalistTeamId)
    : undefined;

  const championSignal = champion?.champion ?? 0;
  const finalistSignal = finalist?.final ?? 0;
  const championPathSignal = champion?.final ?? 0;
  const rawScore =
    38 + championSignal * 190 + championPathSignal * 28 + finalistSignal * 32;

  return Math.max(1, Math.min(100, Math.round(rawScore)));
}

function findRecentDuplicate(
  store: LeaderboardEntry[],
  input: BracketSubmission,
  now: number,
): LeaderboardEntry | undefined {
  return store.find(
    (entry) =>
      entry.name === input.name &&
      entry.championTeamId === input.championTeamId &&
      (entry.finalistTeamId ?? undefined) === (input.finalistTeamId ?? undefined) &&
      now - Date.parse(entry.createdAt) < DUPLICATE_WINDOW_MS,
  );
}

export const inMemoryLeaderboardRepository: LeaderboardRepository = {
  async list() {
    return [...getStore()].sort((left, right) => right.score - left.score);
  },

  async saveDemoBracket(input: BracketSubmission) {
    const store = getStore();
    const now = Date.now();

    const duplicate = findRecentDuplicate(store, input, now);
    if (duplicate) {
      return duplicate;
    }

    const entry: LeaderboardEntry = {
      id: `demo-${randomUUID()}`,
      name: input.name,
      championTeamId: input.championTeamId,
      finalistTeamId: input.finalistTeamId,
      score: createModelDemoScore(input.championTeamId, input.finalistTeamId),
      createdAt: new Date(now).toISOString(),
      mode: DATASET_MODE,
    };

    store.push(entry);

    while (store.length > MAX_LEADERBOARD_ENTRIES) {
      store.shift();
    }

    return entry;
  },
};

/** Test hook: reset the in-memory leaderboard to its initial empty state. */
export function resetLeaderboardForTests(): void {
  globalStore.worldCupOracleLeaderboard = [];
}

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
