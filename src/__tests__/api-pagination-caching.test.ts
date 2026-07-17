import { beforeEach, describe, expect, it } from "vitest";

import { GET as leaderboardGet } from "@/app/api/leaderboard/route";
import { GET as matchesGet } from "@/app/api/matches/route";
import { GET as teamsGet } from "@/app/api/teams/route";
import { resetRateLimitStoreForTests } from "@/lib/api/rate-limit";
import {
  inMemoryLeaderboardRepository,
  resetLeaderboardForTests,
} from "@/lib/repositories/in-memory";

const HEAVY_SIMULATION_TIMEOUT_MS = 180_000;

interface PaginatedLeaderboard {
  ok: boolean;
  data: {
    pagination: { limit: number; offset: number; total: number };
    entries: Array<{ name: string }>;
  };
}

interface PaginatedMatches {
  ok: boolean;
  data: {
    historicalSample: {
      pagination: { limit: number; offset: number; total: number };
      matches: unknown[];
    };
  };
}

describe("pagination", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("paginates the leaderboard with defaults and explicit windows", async () => {
    resetLeaderboardForTests();

    for (let index = 0; index < 5; index += 1) {
      await inMemoryLeaderboardRepository.saveDemoBracket({
        name: `Pagination ${index}`,
        championTeamId: "argentina",
      });
    }

    const defaultResponse = await leaderboardGet(
      new Request("http://localhost/api/leaderboard"),
    );
    const defaultPayload = (await defaultResponse.json()) as PaginatedLeaderboard;

    expect(defaultResponse.status).toBe(200);
    expect(defaultPayload.data.pagination).toMatchObject({
      limit: 50,
      offset: 0,
      total: 5,
    });
    expect(defaultPayload.data.entries).toHaveLength(5);

    const windowResponse = await leaderboardGet(
      new Request("http://localhost/api/leaderboard?limit=2&offset=4"),
    );
    const windowPayload = (await windowResponse.json()) as PaginatedLeaderboard;

    expect(windowPayload.data.entries).toHaveLength(1);
    expect(windowPayload.data.pagination).toMatchObject({ limit: 2, offset: 4 });
  }, HEAVY_SIMULATION_TIMEOUT_MS);

  it("rejects out-of-range pagination input with a validation envelope", async () => {
    const response = await leaderboardGet(
      new Request("http://localhost/api/leaderboard?limit=100000"),
    );

    expect(response.status).toBe(422);
  });

  it("paginates historical rows on /api/matches", async () => {
    const response = await matchesGet(
      new Request("http://localhost/api/matches?limit=10&offset=45"),
    );
    const payload = (await response.json()) as PaginatedMatches;

    expect(response.status).toBe(200);
    expect(payload.data.historicalSample.pagination.total).toBeGreaterThan(40);
    expect(payload.data.historicalSample.matches.length).toBeLessThanOrEqual(10);
  });
});

describe("conditional GET caching", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("serves an ETag on /api/teams and answers If-None-Match with 304", async () => {
    const first = await teamsGet(new Request("http://localhost/api/teams"));
    const etag = first.headers.get("etag");

    expect(first.status).toBe(200);
    expect(etag).toBeTruthy();
    expect(first.headers.get("cache-control")).toContain("max-age=300");

    const second = await teamsGet(
      new Request("http://localhost/api/teams", {
        headers: { "If-None-Match": etag ?? "" },
      }),
    );

    expect(second.status).toBe(304);
    expect(await second.text()).toBe("");
    expect(second.headers.get("etag")).toBe(etag);
  });

  it("keeps the ETag stable across requests with differing request ids", async () => {
    const first = await teamsGet(new Request("http://localhost/api/teams"));
    const second = await teamsGet(new Request("http://localhost/api/teams"));

    expect(first.headers.get("etag")).toBe(second.headers.get("etag"));
  });
});
