import { afterEach, describe, expect, it } from "vitest";

import {
  buildResolvedMatchesFromLive,
  ILLUSTRATIVE_LABEL,
  liveMatchToResolvedMatch,
  liveLabel,
  loadLiveResolvedMatches,
  normalizeTeamName,
  outcomeFromScore,
  resolveTeamId,
  selectCalibrationSource,
} from "@/lib/calibration";
import {
  type FootballDataMatchesResponse,
  fetchFinishedWorldCupMatches,
} from "@/lib/live/football-data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { predictMatch } from "@/lib/prediction/match";
import type { ResolvedMatch } from "@/lib/calibration/types";
import type { LiveMatch } from "@/lib/live/types";

function resolved(id: string, actual: ResolvedMatch["actual"]): ResolvedMatch {
  return {
    id,
    homeTeamId: "argentina",
    awayTeamId: "france",
    predicted: { win: 0.5, draw: 0.25, loss: 0.25 },
    actual,
    kickoff: "2026-06-12T18:00:00Z",
  };
}

function liveMatch(overrides: Partial<LiveMatch> & { id: string }): LiveMatch {
  return {
    status: "finished",
    utcDate: "2026-06-12T18:00:00Z",
    stage: "GROUP_STAGE",
    homeName: "Argentina",
    homeCode: "ARG",
    awayName: "France",
    awayCode: "FRA",
    homeScore: 1,
    awayScore: 0,
    minute: null,
    ...overrides,
  };
}

describe("team resolver", () => {
  it("normalizes names to bare alphanumerics, stripping accents", () => {
    expect(normalizeTeamName("Türkiye")).toBe("turkiye");
    expect(normalizeTeamName("United States")).toBe("unitedstates");
    expect(normalizeTeamName("Côte d'Ivoire")).toBe("cotedivoire");
  });

  it("resolves by FIFA tri-code first", () => {
    expect(resolveTeamId({ name: "anything", code: "ARG" })).toBe("argentina");
    expect(resolveTeamId({ name: "ignored", code: "fra" })).toBe("france");
  });

  it("falls back to a normalized name when the code is unknown", () => {
    expect(resolveTeamId({ name: "United States", code: "ZZZ" })).toBe("usa");
    expect(resolveTeamId({ name: "Saudi Arabia", code: "SAU" })).toBe(
      "saudi-arabia",
    );
  });

  it("maps provider name variants through the alias table", () => {
    expect(resolveTeamId({ name: "Korea Republic", code: null })).toBe(
      "south-korea",
    );
    expect(resolveTeamId({ name: "IR Iran", code: null })).toBe("iran");
    expect(resolveTeamId({ name: "Türkiye", code: null })).toBe("turkey");
  });

  it("returns null for teams it cannot match confidently", () => {
    expect(resolveTeamId({ name: "Atlantis", code: "ATL" })).toBeNull();
    expect(resolveTeamId({ name: null, code: null })).toBeNull();
  });
});

describe("outcomeFromScore", () => {
  it("reads the home-perspective result from the final score", () => {
    expect(outcomeFromScore(2, 1)).toBe("win");
    expect(outcomeFromScore(1, 1)).toBe("draw");
    expect(outcomeFromScore(0, 2)).toBe("loss");
  });
});

describe("liveMatchToResolvedMatch", () => {
  const ratings = buildTeamRatings();

  it("grades the real engine forecast against the real final score", () => {
    const result = liveMatchToResolvedMatch(
      liveMatch({ id: "100", homeScore: 2, awayScore: 1 }),
      ratings,
    );
    const forecast = predictMatch("argentina", "france", ratings);

    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: "live-resolved-100",
      homeTeamId: "argentina",
      awayTeamId: "france",
      actual: "win",
      kickoff: "2026-06-12T18:00:00Z",
    });
    // The forecast is the model's own pre-match probability — NOT sampled from it.
    expect(result?.predicted).toEqual({
      win: forecast.probabilities.teamAWin,
      draw: forecast.probabilities.draw,
      loss: forecast.probabilities.teamBWin,
    });
  });

  it("reads draws and away wins from the score", () => {
    expect(
      liveMatchToResolvedMatch(
        liveMatch({ id: "1", homeScore: 1, awayScore: 1 }),
        ratings,
      )?.actual,
    ).toBe("draw");
    expect(
      liveMatchToResolvedMatch(
        liveMatch({ id: "2", homeScore: 0, awayScore: 3 }),
        ratings,
      )?.actual,
    ).toBe("loss");
  });

  it("skips matches that are not finished", () => {
    expect(
      liveMatchToResolvedMatch(liveMatch({ id: "3", status: "live" }), ratings),
    ).toBeNull();
    expect(
      liveMatchToResolvedMatch(liveMatch({ id: "4", status: "upcoming" }), ratings),
    ).toBeNull();
  });

  it("skips finished matches missing a final score", () => {
    expect(
      liveMatchToResolvedMatch(
        liveMatch({ id: "5", homeScore: null, awayScore: 2 }),
        ratings,
      ),
    ).toBeNull();
  });

  it("skips matches with an unmappable team", () => {
    expect(
      liveMatchToResolvedMatch(
        liveMatch({ id: "6", awayName: "Atlantis", awayCode: "ATL" }),
        ratings,
      ),
    ).toBeNull();
  });

  it("skips matches that resolve to the same team on both sides", () => {
    expect(
      liveMatchToResolvedMatch(
        liveMatch({
          id: "7",
          homeName: "Korea Republic",
          homeCode: "",
          awayName: "South Korea",
          awayCode: "",
        }),
        ratings,
      ),
    ).toBeNull();
  });
});

describe("buildResolvedMatchesFromLive", () => {
  it("keeps only gradable matches and orders them oldest kickoff first", () => {
    const matches: LiveMatch[] = [
      liveMatch({ id: "late", utcDate: "2026-06-20T18:00:00Z" }),
      liveMatch({ id: "skip", status: "live" }),
      liveMatch({ id: "unmappable", awayName: "Atlantis", awayCode: "ATL" }),
      liveMatch({ id: "early", utcDate: "2026-06-11T18:00:00Z" }),
    ];

    const resolvedMatches = buildResolvedMatchesFromLive(matches);

    expect(resolvedMatches.map((match) => match.id)).toEqual([
      "live-resolved-early",
      "live-resolved-late",
    ]);
  });

  it("returns an empty array when nothing is gradable", () => {
    expect(
      buildResolvedMatchesFromLive([liveMatch({ id: "x", status: "upcoming" })]),
    ).toEqual([]);
  });
});

describe("selectCalibrationSource (real-vs-synthetic switch)", () => {
  const live = [resolved("live-1", "win"), resolved("live-2", "loss")];
  const synthetic = [
    resolved("syn-1", "win"),
    resolved("syn-2", "draw"),
    resolved("syn-3", "loss"),
  ];

  it("uses real results the moment at least one match has resolved", () => {
    const source = selectCalibrationSource(live, synthetic);

    expect(source.kind).toBe("live");
    expect(source.isLive).toBe(true);
    expect(source.matches).toBe(live);
    expect(source.resolvedCount).toBe(2);
    expect(source.label).toBe(liveLabel(2));
  });

  it("falls back to the labeled synthetic illustration when no real match exists", () => {
    const source = selectCalibrationSource([], synthetic);

    expect(source.kind).toBe("illustrative");
    expect(source.isLive).toBe(false);
    expect(source.matches).toBe(synthetic);
    expect(source.resolvedCount).toBe(0);
    expect(source.label).toBe(ILLUSTRATIVE_LABEL);
  });

  it("never mixes the two sources", () => {
    const liveSource = selectCalibrationSource(live, synthetic);
    const synthSource = selectCalibrationSource([], synthetic);

    // Exactly one source, never the concatenation of both.
    expect(liveSource.matches).toHaveLength(live.length);
    expect(liveSource.matches.every((match) => match.id.startsWith("live-"))).toBe(
      true,
    );
    expect(synthSource.matches.every((match) => match.id.startsWith("syn-"))).toBe(
      true,
    );
  });

  it("treats an empty synthetic fallback as still illustrative", () => {
    const source = selectCalibrationSource([], []);

    expect(source.kind).toBe("illustrative");
    expect(source.resolvedCount).toBe(0);
    expect(source.matches).toEqual([]);
  });
});

const finishedResponse: FootballDataMatchesResponse = {
  matches: [
    {
      id: 10,
      utcDate: "2026-06-11T18:00:00Z",
      status: "FINISHED",
      homeTeam: { name: "Argentina", tla: "ARG" },
      awayTeam: { name: "France", tla: "FRA" },
      score: { fullTime: { home: 2, away: 1 } },
    },
    {
      id: 11,
      utcDate: "2026-06-11T21:00:00Z",
      status: "IN_PLAY",
      homeTeam: { name: "Brazil", tla: "BRA" },
      awayTeam: { name: "Spain", tla: "ESP" },
      score: { fullTime: { home: 0, away: 0 } },
    },
  ],
};

describe("fetchFinishedWorldCupMatches", () => {
  const originalKey = process.env.FOOTBALL_DATA_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.FOOTBALL_DATA_API_KEY;
    } else {
      process.env.FOOTBALL_DATA_API_KEY = originalKey;
    }
  });

  it("requests FINISHED matches and returns only finished ones", async () => {
    process.env.FOOTBALL_DATA_API_KEY = "test-key";
    let requestedUrl = "";

    const fetchImpl = (async (url: string) => {
      requestedUrl = url;
      return { ok: true, status: 200, json: async () => finishedResponse };
    }) as unknown as typeof fetch;

    const matches = await fetchFinishedWorldCupMatches({ fetchImpl });

    expect(requestedUrl).toContain("/competitions/WC/matches");
    expect(requestedUrl).toContain("status=FINISHED");
    expect(matches.map((match) => match.id)).toEqual(["10"]);
    expect(matches[0].status).toBe("finished");
  });

  it("throws without an API key so the caller can fall back", async () => {
    delete process.env.FOOTBALL_DATA_API_KEY;
    await expect(fetchFinishedWorldCupMatches()).rejects.toThrow();
  });
});

describe("loadLiveResolvedMatches (graceful)", () => {
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

  it("returns [] and never touches the network without a live provider", async () => {
    delete process.env.LIVE_DATA_PROVIDER;
    delete process.env.FOOTBALL_DATA_API_KEY;

    const fetchImpl = (() => {
      throw new Error("network must not be called");
    }) as unknown as typeof fetch;

    await expect(loadLiveResolvedMatches({ fetchImpl })).resolves.toEqual([]);
  });

  it("grades real finished matches when the live provider responds", async () => {
    process.env.LIVE_DATA_PROVIDER = "football-data";
    process.env.FOOTBALL_DATA_API_KEY = "test-key";

    const fetchImpl = (async () => ({
      ok: true,
      status: 200,
      json: async () => finishedResponse,
    })) as unknown as typeof fetch;

    const matches = await loadLiveResolvedMatches({ fetchImpl });

    expect(matches.map((match) => match.id)).toEqual(["live-resolved-10"]);
    expect(matches[0]).toMatchObject({
      homeTeamId: "argentina",
      awayTeamId: "france",
      actual: "win",
    });
  });

  it("returns [] when the provider errors", async () => {
    process.env.LIVE_DATA_PROVIDER = "football-data";
    process.env.FOOTBALL_DATA_API_KEY = "test-key";

    const fetchImpl = (async () => ({
      ok: false,
      status: 429,
      json: async () => ({}),
    })) as unknown as typeof fetch;

    await expect(loadLiveResolvedMatches({ fetchImpl })).resolves.toEqual([]);
  });
});
