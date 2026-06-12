import { describe, expect, it } from "vitest";

import {
  createModelDemoScore,
  inMemoryLeaderboardRepository,
} from "@/lib/repositories/in-memory";

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
  }, 120_000);

  it("scores demo brackets from model odds instead of team-id string length", () => {
    const brazilScore = createModelDemoScore("brazil", "france");
    const canadaScore = createModelDemoScore("canada", "france");

    expect("brazil".length).toBe("canada".length);
    expect(brazilScore).not.toBe(canadaScore);
    expect(brazilScore).toBeGreaterThan(canadaScore);
  });
});
