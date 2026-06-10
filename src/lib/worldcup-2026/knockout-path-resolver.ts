import { roundOf32Paths } from "../../../data/worldcup-2026/knockout-paths";
import type { GroupCode, StandingRow } from "@/lib/types";

export interface ResolvedKnockoutPath {
  slotId: string;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  sourceLabel: string;
  approximationNote?: string;
}

function groupRow(
  groupTables: Record<GroupCode, StandingRow[]>,
  group: string | undefined,
  index: number,
): StandingRow | undefined {
  if (!group) {
    return undefined;
  }

  return groupTables[group as GroupCode]?.[index];
}

function resolveEntrant(
  entrant: (typeof roundOf32Paths)[number]["home"],
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
): string {
  if (entrant.kind === "group-winner") {
    return groupRow(groupTables, entrant.group, 0)?.teamId ?? "";
  }

  if (entrant.kind === "group-runner-up") {
    return groupRow(groupTables, entrant.group, 1)?.teamId ?? "";
  }

  if (entrant.kind === "third-place-rank") {
    return bestThirdPlace[(entrant.rank ?? 1) - 1]?.teamId ?? "";
  }

  return `winner-match-${entrant.matchNumber ?? "unknown"}`;
}

export function resolveRoundOf32Paths(
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
): ResolvedKnockoutPath[] {
  return roundOf32Paths.map((path) => ({
    slotId: path.slotId,
    matchNumber: path.matchNumber,
    homeTeamId: resolveEntrant(path.home, groupTables, bestThirdPlace),
    awayTeamId: resolveEntrant(path.away, groupTables, bestThirdPlace),
    sourceLabel: path.sourceLabel,
    approximationNote: path.approximationNote,
  }));
}
