import {
  inMemoryLeaderboardRepository,
  inMemoryResolvedMatchRepository,
} from "@/lib/repositories/in-memory";

export const leaderboardRepository = inMemoryLeaderboardRepository;
export const resolvedMatchRepository = inMemoryResolvedMatchRepository;
