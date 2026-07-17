import { describe, expect, it } from "vitest";

import {
  createModelDemoScore,
  inMemoryLeaderboardRepository,
  resetLeaderboardForTests,
} from "@/lib/repositories/in-memory";

const HEAVY_SIMULATION_TIMEOUT_MS = 180_000;

describe("repository adapters", () => {
  it("saves demo leaderboard entries through the in-memory adapter", async () => {
    const before = await inMemoryLeaderboardRepository.list();
    const entry = await inMemoryLeaderboardRepository.saveDemoBracket({
      name: "Repository Test",
      championTeamId: "argentina",
      finalistTeamId: "france",
    });
    const after = await inMemoryLeaderboardRepository.list();

    expect(entry.id).toContain("demo-");
    expect(entry.score).toBeGreaterThan(0);
    expect(after.length).toBe(before.length + 1);
    // Scoring runs the cached baseline simulation on first use (~seconds), so
    // give this test a generous timeout for slow CI and coverage runs.
  }, HEAVY_SIMULATION_TIMEOUT_MS);

  it("scores demo brackets from model odds instead of team-id string length", () => {
    const brazilScore = createModelDemoScore("brazil", "france");
    const canadaScore = createModelDemoScore("canada", "france");

    expect("brazil".length).toBe("canada".length);
    expect(brazilScore).not.toBe(canadaScore);
    expect(brazilScore).toBeGreaterThan(canadaScore);
  });

  it("starts empty with no fabricated seed entries", async () => {
    resetLeaderboardForTests();
    expect(await inMemoryLeaderboardRepository.list()).toHaveLength(0);
  });

  it("returns the existing entry for a duplicate submission inside the window", async () => {
    resetLeaderboardForTests();
    const submission = {
      name: "Double Click",
      championTeamId: "argentina",
      finalistTeamId: "france",
    };

    const first = await inMemoryLeaderboardRepository.saveDemoBracket(submission);
    const second = await inMemoryLeaderboardRepository.saveDemoBracket(submission);

    expect(second.id).toBe(first.id);
    expect(await inMemoryLeaderboardRepository.list()).toHaveLength(1);
  }, HEAVY_SIMULATION_TIMEOUT_MS);

  it("evicts the oldest entry beyond the hard cap", async () => {
    resetLeaderboardForTests();

    for (let index = 0; index < 501; index += 1) {
      await inMemoryLeaderboardRepository.saveDemoBracket({
        name: `Cap Tester ${index}`,
        championTeamId: "argentina",
      });
    }

    const entries = await inMemoryLeaderboardRepository.list();
    expect(entries).toHaveLength(500);
    expect(entries.some((entry) => entry.name === "Cap Tester 0")).toBe(false);
    expect(entries.some((entry) => entry.name === "Cap Tester 500")).toBe(true);
  }, HEAVY_SIMULATION_TIMEOUT_MS);
});