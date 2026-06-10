// Resolves a saved bracket into the display model shared by the bracket page
// and its OG/Twitter share image, so both render identical facts.

import { getChampionProbability } from "@/lib/bracket/model-odds";
import {
  formatChampionOdds,
  verdictForChampionProbability,
  type Verdict,
} from "@/lib/bracket/verdict";
import { teamById } from "@/lib/data";
import type { LeaderboardEntry } from "@/lib/types";

export interface BracketShareModel {
  id: string;
  name: string;
  championId: string;
  championName: string;
  championCode: string;
  championAccent: string;
  finalistName: string | null;
  championProbability: number;
  championOdds: string;
  verdict: Verdict;
  score: number;
}

export function buildBracketShareModel(
  entry: LeaderboardEntry,
): BracketShareModel {
  const champion = teamById.get(entry.championTeamId);
  const finalist = entry.finalistTeamId
    ? teamById.get(entry.finalistTeamId)
    : undefined;
  const championProbability = getChampionProbability(entry.championTeamId);

  return {
    id: entry.id,
    name: entry.name,
    championId: entry.championTeamId,
    championName: champion?.name ?? entry.championTeamId,
    championCode: champion?.code ?? entry.championTeamId.slice(0, 3).toUpperCase(),
    championAccent: champion?.accent ?? "#6ee7b7",
    finalistName: finalist?.name ?? null,
    championProbability,
    championOdds: formatChampionOdds(championProbability),
    verdict: verdictForChampionProbability(championProbability),
    score: entry.score,
  };
}
