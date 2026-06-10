import {
  inMemoryBracketRepository,
  inMemoryLeaderboardRepository,
  inMemoryResolvedMatchRepository,
  inMemorySimulationRepository,
} from "@/lib/repositories/in-memory";

export const leaderboardRepository = inMemoryLeaderboardRepository;
export const bracketRepository = inMemoryBracketRepository;
export const simulationRepository = inMemorySimulationRepository;
export const resolvedMatchRepository = inMemoryResolvedMatchRepository;
