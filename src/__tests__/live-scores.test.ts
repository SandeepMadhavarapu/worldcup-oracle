import { afterEach, describe, expect, it } from "vitest";

import { detectScoreChanges } from "@/lib/live/diff";
import {
  type FootballDataMatchesResponse,
  normalizeFootballDataMatches,
  orderLiveMatches,
} from "@/lib/live/football-data";
import { loadLiveScores } from "@/lib/live/scores";
import type { LiveMatch } from "@/lib/live/types";

function liveMatch(overrides: Partial<LiveMatch> & { id: string }): LiveMatch {
  return {
    status: "live",
    utcDate: "2026-06-11T18:00:00Z",
    stage: null,
    homeName: "Home",
    homeCode: "HOM",
    awayName: "Away",
    awayCode: "AWY",
    homeScore: 0,
    awayScore: 0,
    minute: null,
    ...overrides,
  };
}

const rawResponse: FootballDataMatchesResponse = {
  matches: [
    {
      id: 1,
      utcDate: "2026-06-11T18:00:00Z",
      status: "TIMED",
      stage: "GROUP_STAGE",
      homeTeam: { name: "Argentina", tla: "ARG" },
      awayTeam: { name: "Mexico", tla: "MEX" },
      score: { fullTime: { home: null, away: null } },
    },
    {
      id: 2,
      utcDate: "2026-06-11T15:00:00Z",
      status: "IN_PLAY",
      minute: 67,
      homeTeam: { name: "Brazil", tla: "BRA" },
      awayTeam: { name: "Serbia", tla: "SRB" },
      score: { fullTime: { home: 1, away: 0 } },
    },
    {
      id: 3,
      utcDate: "2026-06-10T18:00:00Z",
      status: "FINISHED",
      homeTeam: { name: "France", tla: "FRA" },
      awayTeam: { shortName: "Croatia" },
      score: { fullTime: { home: 2, away: 1 } },
    },
  ],
};

describe("normalizeFootballDataMatches", () => {
  it("maps statuses, codes, scores and live minute", () => {
    const matches = normalizeFootballDataMatches(rawResponse);

    expect(matches[0]).toMatchObject({
      id: "1",
      status: "upcoming",
      homeCode: "ARG",
      awayCode: "MEX",
      homeScore: null,
      awayScore: null,
      minute: null,
    });
    expect(matches[1]).toMatchObject({
      id: "2",
      status: "live",
      homeScore: 1,
      awayScore: 0,
      minute: "67",
    });
    // shortName with no tla -> derived 3-letter code
    expect(matches[2]).toMatchObject({
      id: "3",
      status: "finished",
      awayName: "Croatia",
      awayCode: "CRO",
    });
  });

  it("handles an empty/missing matches list", () => {
    expect(normalizeFootballDataMatches({})).toEqual([]);
  });
});

describe("orderLiveMatches", () => {
  it("orders live first, then soonest upcoming, then newest finished", () => {
    const ordered = orderLiveMatches(normalizeFootballDataMatches(rawResponse));
    expect(ordered.map((match) => match.id)).toEqual(["2", "1", "3"]);
  });

  it("caps the number of matches", () => {
    const many = Array.from({ length: 20 }, (_, index) =>
      liveMatch({ id: String(index), status: "upcoming" }),
    );
    expect(orderLiveMatches(many, 5)).toHaveLength(5);
  });
});

describe("detectScoreChanges", () => {
  it("flags only matches whose combined score increased", () => {
    const previous = [
      liveMatch({ id: "a", homeScore: 0, awayScore: 0 }),
      liveMatch({ id: "b", homeScore: 1, awayScore: 1 }),
    ];
    const next = [
      liveMatch({ id: "a", homeScore: 1, awayScore: 0 }), // goal
      liveMatch({ id: "b", homeScore: 1, awayScore: 1 }), // unchanged
    ];

    expect(detectScoreChanges(previous, next)).toEqual(["a"]);
  });

  it("does not flag new matches or downward corrections", () => {
    const previous = [liveMatch({ id: "a", homeScore: 2, awayScore: 1 })];
    const next = [
      liveMatch({ id: "a", homeScore: 1, awayScore: 1 }), // correction down
      liveMatch({ id: "new", homeScore: 3, awayScore: 0 }), // first appearance
    ];

    expect(detectScoreChanges(previous, next)).toEqual([]);
  });

  it("treats null upcoming scores as zero", () => {
    const previous = [
      liveMatch({ id: "a", status: "upcoming", homeScore: null, awayScore: null }),
    ];
    const next = [liveMatch({ id: "a", status: "live", homeScore: 1, awayScore: 0 })];

    expect(detectScoreChanges(previous, next)).toEqual(["a"]);
  });
});

describe("loadLiveScores (graceful, provider mocked)", () => {
  const originalProvider = process.env.LIVE_DATA_PROVIDER;
  const originalKey = process.env.FOOTBALL_DATA_API_KEY;

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.LIVE_DATA_PROVIDER;
    } else {
      process.env.LIVE_DATA_PROVIDER = originalProvider;
    }

    if (originalKey === undefined) {
      delete process.env.FOOTBALL_DATA_API_KEY;
    } else {
      process.env.FOOTBALL_DATA_API_KEY = originalKey;
    }
  });

  it("falls back to unavailable with no API key and never touches the network", async () => {
    delete process.env.LIVE_DATA_PROVIDER;
    delete process.env.FOOTBALL_DATA_API_KEY;

    const fetchImpl = (() => {
      throw new Error("network must not be called");
    }) as unknown as typeof fetch;

    const payload = await loadLiveScores({ fetchImpl, now: () => 0 });

    expect(payload.status).toBe("unavailable");
    expect(payload.matches).toEqual([]);
    expect(payload.reason).toBeTruthy();
    expect(payload.label).toBe("Near-live, ~45s refresh");
  });

  it("returns mapped matches when the provider responds", async () => {
    process.env.LIVE_DATA_PROVIDER = "football-data";
    process.env.FOOTBALL_DATA_API_KEY = "test-key";

    const fetchImpl = (async () => ({
      ok: true,
      status: 200,
      json: async () => rawResponse,
    })) as unknown as typeof fetch;

    const payload = await loadLiveScores({ fetchImpl, now: () => 0 });

    expect(payload.status).toBe("available");
    expect(payload.reason).toBeNull();
    expect(payload.matches.map((match) => match.id)).toEqual(["2", "1", "3"]);
  });

  it("falls back to unavailable when the provider errors", async () => {
    process.env.LIVE_DATA_PROVIDER = "football-data";
    process.env.FOOTBALL_DATA_API_KEY = "test-key";

    const fetchImpl = (async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    const payload = await loadLiveScores({ fetchImpl, now: () => 0 });

    expect(payload.status).toBe("unavailable");
    expect(payload.matches).toEqual([]);
    expect(payload.reason).toBeTruthy();
  });
});
