import type { LeaderboardEntry } from "@/lib/types";
import { leaderboardRepository } from "@/lib/repositories";

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return leaderboardRepository.list();
}

export function saveDemoBracket(input: {
  name: string;
  championTeamId: string;
  finalistTeamId?: string;
}): Promise<LeaderboardEntry> {
  return leaderboardRepository.saveDemoBracket(input);
}
