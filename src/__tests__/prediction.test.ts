import { describe, expect, it } from "vitest";

import { buildTeamRatings } from "@/lib/prediction/elo";
import { createScorelineDistribution, predictMatch } from "@/lib/prediction/match";
import { updateEloRatings } from "@/lib/prediction/elo";

describe("prediction engine", () => {
  it("increases the winner rating and decreases the loser rating", () => {
    const result = updateEloRatings(1800, 1700, {
      date: "2025-01-01",
      homeGoals: 2,
      awayGoals: 0,
      neutral: true,
      competition: "qualifier",
    });

    expect(result.home).toBeGreaterThan(1800);
    expect(result.away).toBeLessThan(1700);
    expect(result.delta).toBeGreaterThan(0);
  });

  it("returns a normalized match probability distribution", () => {
    const ratings = buildTeamRatings();
    const prediction = predictMatch("argentina", "new-zealand", ratings);
    const total =
      prediction.probabilities.teamAWin +
      prediction.probabilities.draw +
      prediction.probabilities.teamBWin;

    expect(total).toBeCloseTo(1, 3);
    expect(prediction.probabilities.teamAWin).toBeGreaterThan(
      prediction.probabilities.teamBWin,
    );
    expect(prediction.topScorelines.length).toBeGreaterThan(0);
  });

  it("shows uncertainty through a non-zero draw probability", () => {
    const ratings = buildTeamRatings();
    const prediction = predictMatch("spain", "france", ratings);

    expect(prediction.probabilities.draw).toBeGreaterThan(0.1);
    expect(prediction.confidence).toBeLessThanOrEqual(0.91);
    expect(prediction.explanation.length).toBeGreaterThanOrEqual(3);
    expect(prediction.factors.length).toBeGreaterThanOrEqual(4);
    expect(prediction.limitations.length).toBeGreaterThan(0);
  });

  it("creates a sane scoreline distribution", () => {
    const scorelines = createScorelineDistribution(1.45, 1.05);
    const total = scorelines.reduce((sum, scoreline) => sum + scoreline.probability, 0);
    const nilNil = scorelines.find(
      (scoreline) => scoreline.homeGoals === 0 && scoreline.awayGoals === 0,
    );

    expect(total).toBeCloseTo(1, 6);
    expect(scorelines).toHaveLength(49);
    expect(nilNil?.probability).toBeGreaterThan(0);
  });
});
