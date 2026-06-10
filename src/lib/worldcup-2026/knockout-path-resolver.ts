import { roundOf32Paths } from "../../../data/worldcup-2026/knockout-paths";
import type { BracketResolutionMetadata, GroupCode, StandingRow } from "@/lib/types";

export interface ResolvedKnockoutPath {
  slotId: string;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  sourceLabel: string;
  approximationNote?: string;
}

export interface RoundOf32Resolution {
  paths: ResolvedKnockoutPath[];
  metadata: BracketResolutionMetadata;
}

type RoundOf32Path = (typeof roundOf32Paths)[number];
type RoundOf32Entrant = RoundOf32Path["home"];
type EntrantSide = "home" | "away";

interface ThirdPlaceSlot {
  key: string;
  path: RoundOf32Path;
  side: EntrantSide;
  preferredIndex: number;
  forbiddenGroup?: GroupCode;
  order: number;
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

function entrantGroup(entrant: RoundOf32Entrant): GroupCode | undefined {
  if (entrant.kind === "group-winner" || entrant.kind === "group-runner-up") {
    return entrant.group as GroupCode | undefined;
  }

  return undefined;
}

function slotKey(path: RoundOf32Path, side: EntrantSide): string {
  return `${path.slotId}:${side}`;
}

function thirdPlaceSlots(): ThirdPlaceSlot[] {
  const slots: ThirdPlaceSlot[] = [];

  roundOf32Paths.forEach((path, order) => {
    if (path.home.kind === "third-place-rank") {
      slots.push({
        key: slotKey(path, "home"),
        path,
        side: "home",
        preferredIndex: Math.max(0, (path.home.rank ?? 1) - 1),
        forbiddenGroup: entrantGroup(path.away),
        order,
      });
    }

    if (path.away.kind === "third-place-rank") {
      slots.push({
        key: slotKey(path, "away"),
        path,
        side: "away",
        preferredIndex: Math.max(0, (path.away.rank ?? 1) - 1),
        forbiddenGroup: entrantGroup(path.home),
        order,
      });
    }
  });

  return slots;
}

function assignThirdPlaceSlots(
  slots: ThirdPlaceSlot[],
  bestThirdPlace: StandingRow[],
): Map<string, StandingRow> {
  const candidates = bestThirdPlace.slice(0, slots.length);
  const assignment = new Map<string, StandingRow>();
  const usedTeamIds = new Set<string>();
  const slotOrder = [...slots].sort((left, right) => {
    const leftOptions = candidates.filter(
      (row) => row.group !== left.forbiddenGroup,
    ).length;
    const rightOptions = candidates.filter(
      (row) => row.group !== right.forbiddenGroup,
    ).length;

    return leftOptions - rightOptions || left.order - right.order;
  });

  function sortedCandidates(slot: ThirdPlaceSlot): StandingRow[] {
    return [...candidates].sort((left, right) => {
      const leftIndex = candidates.findIndex((row) => row.teamId === left.teamId);
      const rightIndex = candidates.findIndex((row) => row.teamId === right.teamId);

      return (
        Math.abs(leftIndex - slot.preferredIndex) -
          Math.abs(rightIndex - slot.preferredIndex) ||
        leftIndex - rightIndex
      );
    });
  }

  function search(slotIndex: number): boolean {
    if (slotIndex >= slotOrder.length) {
      return true;
    }

    const slot = slotOrder[slotIndex];
    const compatible = sortedCandidates(slot).filter(
      (row) => row.group !== slot.forbiddenGroup,
    );

    for (const row of compatible) {
      if (usedTeamIds.has(row.teamId)) {
        continue;
      }

      assignment.set(slot.key, row);
      usedTeamIds.add(row.teamId);

      if (search(slotIndex + 1)) {
        return true;
      }

      assignment.delete(slot.key);
      usedTeamIds.delete(row.teamId);
    }

    return false;
  }

  if (search(0)) {
    return assignment;
  }

  // If the curated matrix cannot be satisfied from available third-place rows,
  // keep deterministic output and expose the unresolved rematch in metadata.
  for (const slot of slots) {
    if (assignment.has(slot.key)) {
      continue;
    }

    const fallback = sortedCandidates(slot).find(
      (row) => !usedTeamIds.has(row.teamId),
    );

    if (fallback) {
      assignment.set(slot.key, fallback);
      usedTeamIds.add(fallback.teamId);
    }
  }

  return assignment;
}

function groupForTeam(
  groupTables: Record<GroupCode, StandingRow[]>,
  teamId: string,
): GroupCode | undefined {
  for (const [groupCode, rows] of Object.entries(groupTables)) {
    if (rows.some((row) => row.teamId === teamId)) {
      return groupCode as GroupCode;
    }
  }

  return undefined;
}

function countSameGroupRematches(
  paths: ResolvedKnockoutPath[],
  groupTables: Record<GroupCode, StandingRow[]>,
): number {
  return paths.filter((path) => {
    const homeGroup = groupForTeam(groupTables, path.homeTeamId);
    const awayGroup = groupForTeam(groupTables, path.awayTeamId);

    return Boolean(homeGroup && awayGroup && homeGroup === awayGroup);
  }).length;
}

function resolveEntrant(
  entrant: RoundOf32Entrant,
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
  assignedThirdPlace?: StandingRow,
): string {
  if (entrant.kind === "group-winner") {
    return groupRow(groupTables, entrant.group, 0)?.teamId ?? "";
  }

  if (entrant.kind === "group-runner-up") {
    return groupRow(groupTables, entrant.group, 1)?.teamId ?? "";
  }

  if (entrant.kind === "third-place-rank") {
    return assignedThirdPlace?.teamId ?? bestThirdPlace[(entrant.rank ?? 1) - 1]?.teamId ?? "";
  }

  return `winner-match-${entrant.matchNumber ?? "unknown"}`;
}

function resolvePaths(
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
  thirdPlaceAssignments = new Map<string, StandingRow>(),
): ResolvedKnockoutPath[] {
  return roundOf32Paths.map((path) => ({
    slotId: path.slotId,
    matchNumber: path.matchNumber,
    homeTeamId: resolveEntrant(
      path.home,
      groupTables,
      bestThirdPlace,
      thirdPlaceAssignments.get(slotKey(path, "home")),
    ),
    awayTeamId: resolveEntrant(
      path.away,
      groupTables,
      bestThirdPlace,
      thirdPlaceAssignments.get(slotKey(path, "away")),
    ),
    sourceLabel: path.sourceLabel,
    approximationNote: path.approximationNote,
  }));
}

export function resolveRoundOf32PathsWithMetadata(
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
): RoundOf32Resolution {
  const slots = thirdPlaceSlots();
  const naivePaths = resolvePaths(groupTables, bestThirdPlace);
  const assignments = assignThirdPlaceSlots(slots, bestThirdPlace);
  const paths = resolvePaths(groupTables, bestThirdPlace, assignments);
  const naiveSameGroupRematches = countSameGroupRematches(naivePaths, groupTables);
  const unresolvedSameGroupRematches = countSameGroupRematches(paths, groupTables);

  return {
    paths,
    metadata: {
      isApproximation: true,
      thirdPlaceCompatibilityApplied: slots.length > 0,
      sameGroupRematchesAvoided: Math.max(
        0,
        naiveSameGroupRematches - unresolvedSameGroupRematches,
      ),
      unresolvedSameGroupRematches,
      warning:
        unresolvedSameGroupRematches > 0
          ? "Round-of-32 third-place placement is still approximate and could not avoid every same-group rematch."
          : "Round-of-32 third-place placement is approximate and uses a deterministic compatibility fallback until the exact official matrix is curated.",
    },
  };
}

export function resolveRoundOf32Paths(
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
): ResolvedKnockoutPath[] {
  return resolveRoundOf32PathsWithMetadata(groupTables, bestThirdPlace).paths;
}
