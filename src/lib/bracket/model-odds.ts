// Single source of truth for the model's champion probabilities used by the
// share cards and bracket pages. One fixed-seed simulation is run and memoized
// so the page and the OG image always agree, and crawlers don't trigger a fresh
// Monte Carlo run on every request.

import { buildTeamRatings } from "@/lib/prediction/elo";
import { runTournamentSimulation } from "@/lib/tournament/simulator";

const SHARE_ODDS_SEED = "share-card-baseline";
const SHARE_ODDS_ITERATIONS = 400;

let cache: Map<string, number> | null = null;

function computeChampionProbabilities(): Map<string, number> {
  const ratings = buildTeamRatings();
  const simulation = runTournamentSimulation({
    iterations: SHARE_ODDS_ITERATIONS,
    seed: SHARE_ODDS_SEED,
    ratings,
  });

  return new Map(
    simulation.probabilities.map((row) => [row.teamId, row.champion]),
  );
}

export function getModelChampionProbabilities(): Map<string, number> {
  if (!cache) {
    cache = computeChampionProbabilities();
  }

  return cache;
}

/** Model champion probability for a team, or 0 if the team is unknown. */
export function getChampionProbability(teamId: string): number {
  return getModelChampionProbabilities().get(teamId) ?? 0;
}
