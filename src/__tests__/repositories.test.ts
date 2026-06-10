import { describe, expect, it } from "vitest";

import { inMemoryLeaderboardRepository } from "@/lib/repositories/in-memory";

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
  });
});
