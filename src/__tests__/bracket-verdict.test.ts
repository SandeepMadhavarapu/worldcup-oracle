import { describe, expect, it } from "vitest";

import {
  formatChampionOdds,
  VERDICT_THRESHOLDS,
  verdictForChampionProbability,
} from "@/lib/bracket/verdict";

describe("formatChampionOdds", () => {
  it("rounds to whole percents", () => {
    expect(formatChampionOdds(0.04)).toBe("4%");
    expect(formatChampionOdds(0.155)).toBe("16%");
    expect(formatChampionOdds(1)).toBe("100%");
  });

  it("renders positive sub-1% odds as <1% and non-positive as 0%", () => {
    expect(formatChampionOdds(0.008)).toBe("<1%");
    expect(formatChampionOdds(0)).toBe("0%");
    expect(formatChampionOdds(-0.2)).toBe("0%");
  });
});

describe("verdictForChampionProbability", () => {
  it("tags favorites as a chalk pick", () => {
    expect(verdictForChampionProbability(0.25)).toEqual({
      tag: "Chalk pick",
      tone: "chalk",
    });
    // boundary is inclusive
    expect(verdictForChampionProbability(VERDICT_THRESHOLDS.chalk)).toEqual({
      tag: "Chalk pick",
      tone: "chalk",
    });
  });

  it("tags mid-tier picks as a solid contender", () => {
    expect(verdictForChampionProbability(0.08)).toEqual({
      tag: "Solid contender",
      tone: "balanced",
    });
    expect(verdictForChampionProbability(VERDICT_THRESHOLDS.contender)).toEqual({
      tag: "Solid contender",
      tone: "balanced",
    });
    // just below the chalk line is still a contender
    expect(verdictForChampionProbability(0.119).tone).toBe("balanced");
  });

  it("tags contrarian picks as a bold call with the odds inlined", () => {
    expect(verdictForChampionProbability(0.04)).toEqual({
      tag: "Bold call — 4% champion odds",
      tone: "bold",
    });
    // boundary is inclusive and stays in the bold tier
    expect(verdictForChampionProbability(VERDICT_THRESHOLDS.bold).tone).toBe(
      "bold",
    );
  });

  it("tags true underdogs as a long shot", () => {
    expect(verdictForChampionProbability(0.01)).toEqual({
      tag: "Long shot — 1% champion odds",
      tone: "longshot",
    });
    expect(verdictForChampionProbability(0.004)).toEqual({
      tag: "Long shot — <1% champion odds",
      tone: "longshot",
    });
    expect(verdictForChampionProbability(0)).toEqual({
      tag: "Long shot — 0% champion odds",
      tone: "longshot",
    });
  });

  it("matches the spec example for a 4% contrarian champion", () => {
    expect(verdictForChampionProbability(0.04).tag).toContain("Bold call");
    expect(verdictForChampionProbability(0.04).tag).toContain("4% champion odds");
  });
});
