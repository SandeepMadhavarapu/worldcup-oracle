import { describe, expect, it } from "vitest";

import { buildTeamRatings } from "@/lib/prediction/elo";
import {
  buildStandingsForGroup,
  rankThirdPlaceTeams,
  sortStandings,
} from "@/lib/tournament/rules";
import {
  runTournamentSimulation,
  simulateSingleTournament,
} from "@/lib/tournament/simulator";
import { GROUP_CODES, type GroupCode, type StandingRow } from "@/lib/types";

function row(
  teamId: string,
  group: GroupCode,
  points: number,
  goalDifference: number,
  goalsFor: number,
): StandingRow {
  return {
    teamId,
    group,
    played: 3,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor,
    goalsAgainst: goalsFor - goalDifference,
    goalDifference,
    points,
    status: "pending",
  };
}

describe("tournament rules", () => {
  it("sorts group standings by points, goal difference, and goals scored", () => {
    const sorted = sortStandings([
      row("alpha", "A", 4, 1, 4),
      row("beta", "A", 6, 0, 2),
      row("gamma", "A", 4, 3, 3),
      row("delta", "A", 4, 3, 5),
    ]);

    expect(sorted.map((item) => item.teamId)).toEqual([
      "beta",
      "delta",
      "gamma",
      "alpha",
    ]);
  });

  it("calculates group table points from simulated match results", () => {
    const ratings = buildTeamRatings();
    const table = buildStandingsForGroup(
      "A",
      [
        {
          id: "A-1",
          stage: "Group Stage",
          group: "A",
          homeTeamId: "usa",
          awayTeamId: "ghana",
          homeGoals: 2,
          awayGoals: 0,
        },
        {
          id: "A-2",
          stage: "Group Stage",
          group: "A",
          homeTeamId: "morocco",
          awayTeamId: "japan",
          homeGoals: 1,
          awayGoals: 1,
        },
      ],
      ratings,
      "points-test",
    );

    const usa = table.find((item) => item.teamId === "usa");
    const japan = table.find((item) => item.teamId === "japan");

    expect(usa?.points).toBe(3);
    expect(usa?.goalDifference).toBe(2);
    expect(japan?.points).toBe(1);
  });

  it("ranks the top eight third-place teams", () => {
    const tables = GROUP_CODES.reduce(
      (accumulator, groupCode, index) => {
        accumulator[groupCode] = [
          row(`${groupCode}-winner`, groupCode, 9, 4, 7),
          row(`${groupCode}-runner`, groupCode, 6, 2, 5),
          row(`${groupCode}-third`, groupCode, index, index - 3, index + 1),
          row(`${groupCode}-fourth`, groupCode, 0, -5, 1),
        ];
        return accumulator;
      },
      {} as Record<GroupCode, StandingRow[]>,
    );

    const ranked = rankThirdPlaceTeams(tables);

    expect(ranked).toHaveLength(12);
    expect(ranked.slice(0, 8).every((item) => item.teamId.includes("third"))).toBe(
      true,
    );
    expect(ranked[0]?.points).toBeGreaterThan(ranked[7]?.points ?? 0);
  });

  it("simulates a deterministic knockout path for a fixed seed", () => {
    const ratings = buildTeamRatings();
    const first = simulateSingleTournament("fixed-seed", ratings);
    const second = simulateSingleTournament("fixed-seed", ratings);

    expect(first.championTeamId).toBe(second.championTeamId);
    expect(first.bracket.find((round) => round.name === "Round of 32")?.matches)
      .toHaveLength(16);
    expect(first.bracket.find((round) => round.name === "Final")?.matches)
      .toHaveLength(1);
  });

  it("returns stable Monte Carlo probabilities for deterministic seeds", () => {
    const ratings = buildTeamRatings();
    const first = runTournamentSimulation({
      iterations: 10,
      seed: "repeatable",
      ratings,
    });
    const second = runTournamentSimulation({
      iterations: 10,
      seed: "repeatable",
      ratings,
    });

    expect(first.probabilities).toEqual(second.probabilities);
    expect(first.single.championTeamId).toBe(second.single.championTeamId);
  });

  it("includes interview-ready simulation metadata and qualification probabilities", () => {
    const ratings = buildTeamRatings();
    const summary = runTournamentSimulation({
      iterations: 3,
      seed: "metadata-test",
      ratings,
    });

    expect(summary.metadata.simulationCount).toBe(3);
    expect(summary.metadata.seed).toBe("metadata-test");
    expect(summary.metadata.modelVersion).toContain("worldcup-oracle");
    expect(summary.qualificationProbabilities.length).toBeGreaterThan(0);
    expect(summary.qualificationProbabilities[0]?.groupAdvance).toBeGreaterThanOrEqual(0);
  });
});
