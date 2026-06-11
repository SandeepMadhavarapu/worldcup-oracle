import { describe, expect, it } from "vitest";

import {
  type ChampionPath,
  extractChampionPath,
  pathKey,
  summarizeTitlePaths,
} from "@/lib/tournament/title-paths";
import type {
  KnockoutRound,
  SimulatedMatch,
  SingleTournamentSimulation,
  TitleRunStep,
} from "@/lib/types";

function step(round: TitleRunStep["round"], opponentTeamId: string): TitleRunStep {
  return { round, opponentTeamId };
}

function match(home: string, away: string): SimulatedMatch {
  return {
    id: `${home}-vs-${away}`,
    stage: "knockout",
    homeTeamId: home,
    awayTeamId: away,
    homeGoals: 1,
    awayGoals: 0,
    winnerTeamId: home,
    wentToPenalties: false,
  };
}

function round(name: KnockoutRound["name"], matches: SimulatedMatch[]): KnockoutRound {
  return { name, matches };
}

function single(
  championTeamId: string,
  bracket: KnockoutRound[],
): SingleTournamentSimulation {
  // Only championTeamId and bracket are read by extractChampionPath.
  return { championTeamId, bracket } as unknown as SingleTournamentSimulation;
}

describe("extractChampionPath", () => {
  it("walks the champion's knockout route, ignoring the third-place game", () => {
    const sim = single("argentina", [
      round("Round of 32", [match("argentina", "new-zealand"), match("brazil", "japan")]),
      round("Round of 16", [match("argentina", "usa"), match("spain", "italy")]),
      // champion appears as the away team here
      round("Quarter-finals", [match("france", "argentina")]),
      round("Semi-finals", [match("argentina", "spain")]),
      round("Third-place", [match("france", "spain")]),
      round("Final", [match("brazil", "argentina")]),
    ]);

    expect(extractChampionPath(sim)).toEqual({
      championTeamId: "argentina",
      steps: [
        step("Round of 32", "new-zealand"),
        step("Round of 16", "usa"),
        step("Quarter-finals", "france"),
        step("Semi-finals", "spain"),
        step("Final", "brazil"),
      ],
    });
  });

  it("returns an empty path when there is no champion", () => {
    expect(extractChampionPath(single("", []))).toEqual({
      championTeamId: "",
      steps: [],
    });
  });
});

describe("pathKey", () => {
  it("is stable and order-sensitive", () => {
    const a = [step("Round of 32", "nz"), step("Final", "brazil")];
    const b = [step("Round of 32", "nz"), step("Final", "brazil")];
    const c = [step("Round of 32", "usa"), step("Final", "brazil")];

    expect(pathKey(a)).toBe(pathKey(b));
    expect(pathKey(a)).not.toBe(pathKey(c));
  });
});

describe("summarizeTitlePaths", () => {
  const runA: TitleRunStep[] = [
    step("Round of 32", "nz"),
    step("Round of 16", "usa"),
    step("Quarter-finals", "france"),
    step("Semi-finals", "spain"),
    step("Final", "brazil"),
  ];
  const runB: TitleRunStep[] = [
    step("Round of 32", "nz"),
    step("Round of 16", "usa"),
    step("Quarter-finals", "england"),
    step("Semi-finals", "spain"),
    step("Final", "brazil"),
  ];

  function repeat(championTeamId: string, steps: TitleRunStep[], times: number): ChampionPath[] {
    return Array.from({ length: times }, () => ({ championTeamId, steps }));
  }

  it("computes the modal path, counts, shares and champion probability", () => {
    const paths: ChampionPath[] = [
      ...repeat("argentina", runA, 3),
      ...repeat("argentina", runB, 1),
      ...repeat("brazil", runA, 2),
    ];

    const summary = summarizeTitlePaths(paths, 10);

    // sorted by champion probability desc
    expect(summary.map((row) => row.teamId)).toEqual(["argentina", "brazil"]);

    const argentina = summary[0];
    expect(argentina).toMatchObject({
      teamId: "argentina",
      titleCount: 4,
      modalCount: 3,
    });
    expect(argentina.championProbability).toBeCloseTo(0.4, 10);
    expect(argentina.modalShare).toBeCloseTo(0.75, 10);
    expect(argentina.modalPath).toEqual(runA);

    expect(summary[1].championProbability).toBeCloseTo(0.2, 10);
  });

  it("breaks frequency ties deterministically by path key ascending", () => {
    const alphaFirst: TitleRunStep[] = [step("Round of 32", "alpha")];
    const zetaFirst: TitleRunStep[] = [step("Round of 32", "zeta")];

    const summary = summarizeTitlePaths(
      [
        { championTeamId: "spain", steps: zetaFirst },
        { championTeamId: "spain", steps: alphaFirst },
      ],
      4,
    );

    expect(summary).toHaveLength(1);
    expect(summary[0].modalCount).toBe(1);
    // "Round of 32:alpha" < "Round of 32:zeta"
    expect(summary[0].modalPath).toEqual(alphaFirst);
  });

  it("ignores paths without a champion and handles an empty set", () => {
    expect(summarizeTitlePaths([], 100)).toEqual([]);
    expect(
      summarizeTitlePaths([{ championTeamId: "", steps: [] }], 100),
    ).toEqual([]);
  });
});
