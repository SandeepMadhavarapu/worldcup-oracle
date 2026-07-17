// Contract-shape test for the football-data.org v4 mapping. The fixture below
// mirrors the documented v4 /matches response including the awkward edges the
// happy-path fixtures skip: numeric `minute`, AWARDED status, null full-time
// scores on scheduled games, missing `tla`, provider team names that need the
// alias table, and a team we cannot map at all (must be dropped from grading,
// never guessed).

import { describe, expect, it } from "vitest";

import {
  normalizeFootballDataMatches,
  orderLiveMatches,
  type FootballDataMatchesResponse,
} from "@/lib/live/football-data";
import { buildResolvedMatchesFromLive } from "@/lib/calibration/live-results";
import { buildTeamRatings } from "@/lib/prediction/elo";

const CONTRACT_FIXTURE: FootballDataMatchesResponse = {
  matches: [
    {
      id: 501001,
      utcDate: "2026-07-10T19:00:00Z",
      status: "FINISHED",
      stage: "SEMI_FINALS",
      minute: null,
      homeTeam: { name: "Korea Republic", shortName: "Korea", tla: "KOR" },
      awayTeam: { name: "Türkiye", shortName: "Türkiye", tla: "TUR" },
      score: { fullTime: { home: 1, away: 2 } },
    },
    {
      id: 501002,
      utcDate: "2026-07-11T19:00:00Z",
      status: "AWARDED",
      stage: "SEMI_FINALS",
      minute: null,
      homeTeam: { name: "Argentina", shortName: "Argentina", tla: "ARG" },
      awayTeam: { name: "France", shortName: "France", tla: "FRA" },
      score: { fullTime: { home: 3, away: 0 } },
    },
    {
      id: 501003,
      utcDate: "2026-07-19T19:00:00Z",
      status: "TIMED",
      stage: "FINAL",
      minute: null,
      homeTeam: { name: "TBD" },
      awayTeam: { name: "TBD" },
      score: { fullTime: { home: null, away: null } },
    },
    {
      id: 501004,
      utcDate: "2026-07-12T16:00:00Z",
      status: "IN_PLAY",
      stage: "THIRD_PLACE",
      minute: 73,
      homeTeam: { name: "Brazil", shortName: "Brazil", tla: "BRA" },
      awayTeam: { name: "England", shortName: "England", tla: "ENG" },
      score: { fullTime: { home: 1, away: 1 } },
    },
    {
      id: 501005,
      utcDate: "2026-07-08T19:00:00Z",
      status: "FINISHED",
      stage: "QUARTER_FINALS",
      minute: null,
      // A federation XI we do not model: must be dropped from grading.
      homeTeam: { name: "Ruritania", shortName: "Ruritania" },
      awayTeam: { name: "Spain", shortName: "Spain", tla: "ESP" },
      score: { fullTime: { home: 0, away: 4 } },
    },
  ],
};

describe("football-data v4 contract mapping", () => {
  const normalized = normalizeFootballDataMatches(CONTRACT_FIXTURE);

  it("maps statuses, numeric minutes, and null scores per the v4 contract", () => {
    const byId = new Map(normalized.map((match) => [match.id, match]));

    expect(byId.get("501001")?.status).toBe("finished");
    expect(byId.get("501002")?.status).toBe("finished"); // AWARDED counts as finished
    expect(byId.get("501003")?.status).toBe("upcoming");
    expect(byId.get("501003")?.homeScore).toBeNull();
    expect(byId.get("501004")?.status).toBe("live");
    expect(byId.get("501004")?.minute).toBe("73"); // numeric minute -> string
    expect(byId.get("501005")?.homeCode).toBe("RUR"); // missing tla -> derived
  });

  it("orders live first, then upcoming, then finished newest-first", () => {
    const ordered = orderLiveMatches(normalized);

    expect(ordered[0]?.id).toBe("501004");
    expect(ordered[1]?.id).toBe("501003");
    expect(ordered[2]?.id).toBe("501002");
    expect(ordered[3]?.id).toBe("501001");
  });

  it("grades only mappable finished matches and drops the rest honestly", () => {
    const resolved = buildResolvedMatchesFromLive(normalized, buildTeamRatings());
    const ids = resolved.map((match) => match.id);

    // 501001 (alias-mapped teams) and 501002 (AWARDED) are gradable;
    // 501003 is unfinished, 501004 is in play, 501005 has an unmappable team.
    expect(ids).toEqual(["live-resolved-501001", "live-resolved-501002"]);

    const korea = resolved[0];
    expect(korea?.homeTeamId).toBe("south-korea");
    expect(korea?.awayTeamId).toBe("turkey");
    expect(korea?.actual).toBe("loss"); // home lost 1-2
  });
});
