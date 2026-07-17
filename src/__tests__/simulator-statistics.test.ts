// Statistical invariants of the Monte Carlo simulator. These are the tests
// that catch a broken aggregation or a probability leak that per-match unit
// tests cannot see: probability mass must be conserved across every round.

import { describe, expect, it } from "vitest";

import { runTournamentSimulation } from "@/lib/tournament/simulator";

const ITERATIONS = 200;
const SEED = "simulator-statistics";

// Per-team probabilities are rounded to 4dp before aggregation, so sums drift
// by at most teams * 0.00005.
const EPSILON = 48 * 0.00005 + 1e-9;

function summary() {
  return runTournamentSimulation({ iterations: ITERATIONS, seed: SEED });
}

describe("simulator statistical invariants", () => {
  const result = summary();

  function roundSum(key: "champion" | "final" | "semiFinal" | "quarterFinal" | "roundOf16" | "roundOf32"): number {
    return result.probabilities.reduce((total, row) => total + row[key], 0);
  }

  it("conserves probability mass in every round", () => {
    // Exactly 1 champion, 2 finalists, 4 semi-finalists, 8 quarter-finalists,
    // 16 R16 teams, and 32 R32 teams per simulated tournament.
    expect(roundSum("champion")).toBeCloseTo(1, 2);
    expect(Math.abs(roundSum("champion") - 1)).toBeLessThan(EPSILON);
    expect(Math.abs(roundSum("final") - 2)).toBeLessThan(EPSILON * 2);
    expect(Math.abs(roundSum("semiFinal") - 4)).toBeLessThan(EPSILON * 4);
    expect(Math.abs(roundSum("quarterFinal") - 8)).toBeLessThan(EPSILON * 8);
    expect(Math.abs(roundSum("roundOf16") - 16)).toBeLessThan(EPSILON * 16);
    expect(Math.abs(roundSum("roundOf32") - 32)).toBeLessThan(EPSILON * 32);
  });

  it("keeps every team's round probabilities monotonically non-increasing", () => {
    for (const row of result.probabilities) {
      expect(row.roundOf16).toBeLessThanOrEqual(row.roundOf32 + 1e-9);
      expect(row.quarterFinal).toBeLessThanOrEqual(row.roundOf16 + 1e-9);
      expect(row.semiFinal).toBeLessThanOrEqual(row.quarterFinal + 1e-9);
      expect(row.final).toBeLessThanOrEqual(row.semiFinal + 1e-9);
      expect(row.champion).toBeLessThanOrEqual(row.final + 1e-9);
    }
  });

  it("keeps every probability in [0, 1]", () => {
    for (const row of result.probabilities) {
      for (const key of [
        "roundOf32",
        "roundOf16",
        "quarterFinal",
        "semiFinal",
        "final",
        "champion",
      ] as const) {
        expect(row[key]).toBeGreaterThanOrEqual(0);
        expect(row[key]).toBeLessThanOrEqual(1);
      }
    }
  });

  it("is exactly reproducible for a fixed seed and diverges for a new seed", () => {
    const again = runTournamentSimulation({ iterations: ITERATIONS, seed: SEED });
    expect(again.probabilities).toEqual(result.probabilities);
    expect(again.mostLikelyFinal).toEqual(result.mostLikelyFinal);

    const different = runTournamentSimulation({
      iterations: ITERATIONS,
      seed: `${SEED}-other`,
    });
    expect(different.probabilities).not.toEqual(result.probabilities);
  });

  it("sums qualification paths to the group-advance probability", () => {
    for (const row of result.qualificationProbabilities) {
      expect(
        Math.abs(row.topTwo + row.bestThirdPlace - row.groupAdvance),
      ).toBeLessThan(0.0002);
    }
  });
});
