import { getTeamsByGroup } from "@/lib/data";
import {
  GROUP_CODES,
  type GroupCode,
  type SimulatedMatch,
  type StandingRow,
  type TeamRating,
} from "@/lib/types";
import { deterministicNoise } from "@/lib/prediction/random";

export function createEmptyStanding(teamId: string, group: GroupCode): StandingRow {
  return {
    teamId,
    group,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    status: "pending",
  };
}

export function createGroupFixtures(): SimulatedMatch[] {
  const teamsByGroup = getTeamsByGroup();

  return GROUP_CODES.flatMap((groupCode) => {
    const groupTeams = teamsByGroup[groupCode];
    const pairings = [
      [0, 1],
      [2, 3],
      [0, 2],
      [1, 3],
      [0, 3],
      [1, 2],
    ] as const;

    return pairings.map(([homeIndex, awayIndex], index) => ({
      id: `${groupCode}-${index + 1}`,
      stage: "Group Stage",
      group: groupCode,
      homeTeamId: groupTeams[homeIndex]?.id ?? "",
      awayTeamId: groupTeams[awayIndex]?.id ?? "",
      homeGoals: 0,
      awayGoals: 0,
    }));
  });
}

function addResult(row: StandingRow, goalsFor: number, goalsAgainst: number): void {
  row.played += 1;
  row.goalsFor += goalsFor;
  row.goalsAgainst += goalsAgainst;
  row.goalDifference = row.goalsFor - row.goalsAgainst;

  if (goalsFor > goalsAgainst) {
    row.wins += 1;
    row.points += 3;
  } else if (goalsFor === goalsAgainst) {
    row.draws += 1;
    row.points += 1;
  } else {
    row.losses += 1;
  }
}

export function buildStandingsForGroup(
  group: GroupCode,
  matches: SimulatedMatch[],
  ratings: Map<string, TeamRating>,
  seed: string,
): StandingRow[] {
  const groupTeams = getTeamsByGroup()[group];
  const rows = new Map(
    groupTeams.map((team) => [team.id, createEmptyStanding(team.id, group)]),
  );

  for (const match of matches.filter((item) => item.group === group)) {
    const home = rows.get(match.homeTeamId);
    const away = rows.get(match.awayTeamId);

    if (!home || !away) {
      continue;
    }

    addResult(home, match.homeGoals, match.awayGoals);
    addResult(away, match.awayGoals, match.homeGoals);
  }

  return sortStandings([...rows.values()], matches, ratings, seed);
}

function headToHeadPoints(
  teamId: string,
  opponentId: string,
  matches: SimulatedMatch[],
): number {
  return matches.reduce((points, match) => {
    const isHome = match.homeTeamId === teamId && match.awayTeamId === opponentId;
    const isAway = match.awayTeamId === teamId && match.homeTeamId === opponentId;

    if (!isHome && !isAway) {
      return points;
    }

    const goalsFor = isHome ? match.homeGoals : match.awayGoals;
    const goalsAgainst = isHome ? match.awayGoals : match.homeGoals;

    if (goalsFor > goalsAgainst) {
      return points + 3;
    }

    if (goalsFor === goalsAgainst) {
      return points + 1;
    }

    return points;
  }, 0);
}

export function sortStandings(
  rows: StandingRow[],
  matches: SimulatedMatch[] = [],
  ratings: Map<string, TeamRating> = new Map(),
  seed = "standings",
): StandingRow[] {
  return [...rows].sort((left, right) => {
    const basic =
      right.points - left.points ||
      right.goalDifference - left.goalDifference ||
      right.goalsFor - left.goalsFor;

    if (basic !== 0) {
      return basic;
    }

    const h2h =
      headToHeadPoints(right.teamId, left.teamId, matches) -
      headToHeadPoints(left.teamId, right.teamId, matches);

    if (h2h !== 0) {
      return h2h;
    }

    const ratingDifference =
      (ratings.get(right.teamId)?.rating ?? 1500) -
      (ratings.get(left.teamId)?.rating ?? 1500);

    if (Math.abs(ratingDifference) > 0.01) {
      return ratingDifference;
    }

    return (
      deterministicNoise(`${seed}:${right.teamId}`, 1) -
      deterministicNoise(`${seed}:${left.teamId}`, 1)
    );
  });
}

export function rankThirdPlaceTeams(
  groupTables: Record<GroupCode, StandingRow[]>,
  ratings: Map<string, TeamRating> = new Map(),
  seed = "third-place",
): StandingRow[] {
  const thirdPlaceRows = GROUP_CODES.map((groupCode) => groupTables[groupCode][2]).filter(
    (row): row is StandingRow => Boolean(row),
  );

  return sortStandings(thirdPlaceRows, [], ratings, seed);
}

export function applyQualificationStatus(
  groupTables: Record<GroupCode, StandingRow[]>,
  bestThirdPlace: StandingRow[],
): Record<GroupCode, StandingRow[]> {
  const thirdPlaceQualified = new Set(bestThirdPlace.slice(0, 8).map((row) => row.teamId));

  return GROUP_CODES.reduce(
    (tables, groupCode) => {
      tables[groupCode] = groupTables[groupCode].map((row, index) => {
        if (index < 2) {
          return { ...row, status: "qualified" };
        }

        if (index === 2 && thirdPlaceQualified.has(row.teamId)) {
          return { ...row, status: "third-place bubble" };
        }

        return { ...row, status: "eliminated" };
      });

      return tables;
    },
    {} as Record<GroupCode, StandingRow[]>,
  );
}

export function getAdvancedTeamIds(groupTables: Record<GroupCode, StandingRow[]>): string[] {
  const topTwo = GROUP_CODES.flatMap((groupCode) =>
    groupTables[groupCode].slice(0, 2).map((row) => row.teamId),
  );
  const bestThird = rankThirdPlaceTeams(groupTables).slice(0, 8).map((row) => row.teamId);

  return [...topTwo, ...bestThird];
}
