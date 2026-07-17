import type { ResolvedMatch } from "@/lib/calibration/types";
import type { LeaderboardEntry } from "@/lib/types";

export interface BracketSubmission {
  name: string;
  championTeamId: string;
  finalistTeamId?: string;
}

export interface ResolvedMatchRepository {
  list: () => Promise<ResolvedMatch[]>;
}

export interface LeaderboardRepository {
  list: () => Promise<LeaderboardEntry[]>;
  saveDemoBracket: (input: BracketSubmission) => Promise<LeaderboardEntry>;
}
