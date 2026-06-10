// Pure aggregation of conditional title-run structure from Monte Carlo sims.
// No I/O, no randomness — these run inside the existing simulation loop and are
// unit-tested against hand-built fixtures.

import type {
  KnockoutRound,
  SingleTournamentSimulation,
  TeamTitlePath,
  TitleRunStep,
} from "@/lib/types";

// The champion's route, in order. "Third-place" is deliberately excluded — the
// champion never plays it.
export const TITLE_RUN_ROUNDS: KnockoutRound["name"][] = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

export interface ChampionPath {
  championTeamId: string;
  steps: TitleRunStep[];
}

/**
 * Extract the champion's beaten-opponent sequence from a single simulated
 * tournament: for each knockout round, the opponent they faced (and beat) on
 * the way to the title.
 */
export function extractChampionPath(
  single: SingleTournamentSimulation,
): ChampionPath {
  const championTeamId = single.championTeamId;
  const steps: TitleRunStep[] = [];

  if (!championTeamId) {
    return { championTeamId, steps };
  }

  for (const roundName of TITLE_RUN_ROUNDS) {
    const round = single.bracket.find((entry) => entry.name === roundName);

    if (!round) {
      continue;
    }

    const match = round.matches.find(
      (entry) =>
        entry.homeTeamId === championTeamId ||
        entry.awayTeamId === championTeamId,
    );

    if (!match) {
      continue;
    }

    steps.push({
      round: roundName,
      opponentTeamId:
        match.homeTeamId === championTeamId
          ? match.awayTeamId
          : match.homeTeamId,
    });
  }

  return { championTeamId, steps };
}

/** Stable key for a sequence of beaten opponents. */
export function pathKey(steps: TitleRunStep[]): string {
  return steps.map((step) => `${step.round}:${step.opponentTeamId}`).join(">");
}

/**
 * Reduce per-simulation champion paths into one modal (most frequent) title run
 * per team. Ties on frequency are broken by path key ascending so the result is
 * deterministic. Returned sorted by champion probability descending.
 */
export function summarizeTitlePaths(
  paths: ChampionPath[],
  iterations: number,
): TeamTitlePath[] {
  const byTeam = new Map<string, ChampionPath[]>();

  for (const path of paths) {
    if (!path.championTeamId) {
      continue;
    }

    const list = byTeam.get(path.championTeamId);

    if (list) {
      list.push(path);
    } else {
      byTeam.set(path.championTeamId, [path]);
    }
  }

  const safeIterations = Math.max(1, iterations);
  const summaries: TeamTitlePath[] = [];

  for (const [teamId, list] of byTeam) {
    const counts = new Map<string, { count: number; steps: TitleRunStep[] }>();

    for (const path of list) {
      const key = pathKey(path.steps);
      const entry = counts.get(key);

      if (entry) {
        entry.count += 1;
      } else {
        counts.set(key, { count: 1, steps: path.steps });
      }
    }

    const [, modal] = [...counts.entries()].sort(
      (left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]),
    )[0]!;
    const titleCount = list.length;

    summaries.push({
      teamId,
      titleCount,
      championProbability: titleCount / safeIterations,
      modalPath: modal.steps,
      modalCount: modal.count,
      modalShare: modal.count / titleCount,
    });
  }

  return summaries.sort(
    (left, right) => right.championProbability - left.championProbability,
  );
}
