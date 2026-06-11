// The single cached Monte Carlo baseline reused across the app. It runs ONE
// simulation (memoized for the process lifetime) with title-path collection
// enabled, so champion odds, team round probabilities, and the upset-path
// explorer all read from the same run — no feature adds a second heavy pass.

import { runTournamentSimulation } from "@/lib/tournament/simulator";
import type { TournamentSimulationSummary } from "@/lib/types";

export const BASELINE_SEED = "worldcup-oracle-baseline";
export const BASELINE_ITERATIONS = 1000;

let cache: TournamentSimulationSummary | null = null;

export function getBaselineSimulation(): TournamentSimulationSummary {
  if (!cache) {
    cache = runTournamentSimulation({
      iterations: BASELINE_ITERATIONS,
      seed: BASELINE_SEED,
      collectTitlePaths: true,
    });
  }

  return cache;
}
