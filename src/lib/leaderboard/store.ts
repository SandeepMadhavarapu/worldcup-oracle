import type { LeaderboardEntry } from "@/lib/types";
import { leaderboardRepository } from "@/lib/repositories";

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return leaderboardRepository.list();
}

export async function getBracketById(
  id: string,
): Promise<LeaderboardEntry | null> {
  const entries = await leaderboardRepository.list();
  return entries.find((entry) => entry.id === id) ?? null;
}

export function saveDemoBracket(input: {
  name: string;
  championTeamId: string;
  finalistTeamId?: string;
}): Promise<LeaderboardEntry> {
  return leaderboardRepository.saveDemoBracket(input);
}
