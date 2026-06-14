import { describe, expect, it } from "vitest";

import { worldCup2026Fixtures } from "../../data/worldcup-2026/fixtures";
import { worldCup2026Groups } from "../../data/worldcup-2026/groups";
import { roundOf32Paths } from "../../data/worldcup-2026/knockout-paths";
import { worldCup2026Venues } from "../../data/worldcup-2026/venues";
import { resolveRoundOf32Paths } from "@/lib/worldcup-2026/knockout-path-resolver";
import { GROUP_CODES, type GroupCode, type StandingRow } from "@/lib/types";

function standing(teamId: string, group: GroupCode, points: number): StandingRow {
  return {
    teamId,
    group,
    played: 3,
    wins: 0,
    draws: 0,
    losses: 0,
    goalsFor: points,
    goalsAgainst: 0,
    goalDifference: points,
    points,
    status: "pending",
  };
}

describe("world cup 2026 official-data-ready layer", () => {
  it("defines twelve groups with four stable slots each", () => {
    expect(worldCup2026Groups).toHaveLength(12);

    for (const group of worldCup2026Groups) {
      expect(group.teams).toHaveLength(4);
      expect(group.sourceLabel.length).toBeGreaterThan(0);
      expect(group.teams.every((team) => team.teamSlug.length > 0)).toBe(true);
    }
  });

  it("keeps seeded fixtures labeled and only completed rows carry sourced results", () => {
    expect(worldCup2026Fixtures.length).toBeGreaterThanOrEqual(2);

    const openingMatch = worldCup2026Fixtures.find(
      (fixture) => fixture.matchNumber === 1,
    );
    expect(openingMatch).toMatchObject({
      status: "completed",
      homeTeam: "mexico",
      awayTeam: "south-africa",
      homeGoals: 2,
      awayGoals: 0,
      resultSourceLabel: "manual public match-report result",
    });

    for (const fixture of worldCup2026Fixtures) {
      expect(fixture.matchNumber).toBeGreaterThan(0);
      expect(fixture.sourceLabel.length).toBeGreaterThan(0);

      if (fixture.status === "completed") {
        expect(fixture.homeGoals).toBeGreaterThanOrEqual(0);
        expect(fixture.awayGoals).toBeGreaterThanOrEqual(0);
        expect(fixture.resultSourceLabel?.length).toBeGreaterThan(0);
        continue;
      }

      expect(fixture).not.toHaveProperty("homeGoals");
      expect(fixture).not.toHaveProperty("awayGoals");
    }
  });

  it("defines host-city venue labels and round-of-32 path rows", () => {
    expect(worldCup2026Venues).toHaveLength(16);
    expect(roundOf32Paths).toHaveLength(16);
    expect(roundOf32Paths.every((path) => path.approximationNote)).toBe(true);
  });

  it("resolves round-of-32 paths from group tables and best third-place rows", () => {
    const tables = GROUP_CODES.reduce(
      (accumulator, groupCode) => {
        accumulator[groupCode] = [
          standing(`${groupCode}-winner`, groupCode, 9),
          standing(`${groupCode}-runner`, groupCode, 6),
          standing(`${groupCode}-third`, groupCode, 4),
          standing(`${groupCode}-fourth`, groupCode, 0),
        ];
        return accumulator;
      },
      {} as Record<GroupCode, StandingRow[]>,
    );
    const bestThirdPlace = GROUP_CODES.slice(0, 8).map(
      (groupCode) => tables[groupCode][2]!,
    );
    const paths = resolveRoundOf32Paths(tables, bestThirdPlace);

    expect(paths).toHaveLength(16);
    expect(paths[0]?.homeTeamId).toBe("A-winner");
    expect(paths[0]?.awayTeamId).toBe("H-third");
    expect(paths[8]?.homeTeamId).toBe("I-winner");
    expect(paths[8]?.awayTeamId).toBe("L-runner");
  });
});
