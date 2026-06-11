// Champion probabilities for the share cards and bracket pages. These read from
// the single cached baseline simulation (see baseline.ts) so the share card,
// the bracket page, and the team page all agree — and crawlers never trigger a
// fresh Monte Carlo run.

import { getBaselineSimulation } from "@/lib/tournament/baseline";

let cache: Map<string, number> | null = null;

export function getModelChampionProbabilities(): Map<string, number> {
  if (!cache) {
    cache = new Map(
      getBaselineSimulation().probabilities.map((row) => [
        row.teamId,
        row.champion,
      ]),
    );
  }

  return cache;
}

/** Model champion probability for a team, or 0 if the team is unknown. */
export function getChampionProbability(teamId: string): number {
  return getModelChampionProbabilities().get(teamId) ?? 0;
}
