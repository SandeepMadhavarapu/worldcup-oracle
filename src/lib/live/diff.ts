// Pure score-diff / goal-detection logic. No network, no DOM — unit-tested.

import type { LiveMatch } from "@/lib/live/types";

export function totalGoals(match: Pick<LiveMatch, "homeScore" | "awayScore">): number {
  return (match.homeScore ?? 0) + (match.awayScore ?? 0);
}

/**
 * Return the ids of matches whose combined score INCREASED between the previous
 * and next snapshots — i.e. a goal was scored. Matches that are new in `next`
 * (no previous snapshot) are not flagged, so the first load never flashes.
 * Score corrections downward are not flagged either.
 */
export function detectScoreChanges(
  previous: LiveMatch[],
  next: LiveMatch[],
): string[] {
  const previousById = new Map(previous.map((match) => [match.id, match]));
  const goals: string[] = [];

  for (const match of next) {
    const before = previousById.get(match.id);

    if (!before) {
      continue;
    }

    if (totalGoals(match) > totalGoals(before)) {
      goals.push(match.id);
    }
  }

  return goals;
}
