// football-data.org v4 provider client (FREE tier only). Network access is
// injectable so tests can mock the provider without hitting the wire. The
// mapping and ordering helpers are pure and unit-tested.

import {
  FOOTBALL_DATA_BASE_URL,
  LIVE_MAX_MATCHES,
  LIVE_WINDOW_DAYS_BACK,
  LIVE_WINDOW_DAYS_FORWARD,
  WORLD_CUP_COMPETITION,
} from "@/lib/live/constants";
import type { LiveMatch, LiveMatchStatus } from "@/lib/live/types";

interface FootballDataTeam {
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
}

interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: string;
  stage?: string | null;
  minute?: string | number | null;
  homeTeam?: FootballDataTeam;
  awayTeam?: FootballDataTeam;
  score?: { fullTime?: { home?: number | null; away?: number | null } };
}

export interface FootballDataMatchesResponse {
  matches?: FootballDataMatch[];
}

function mapStatus(raw: string): LiveMatchStatus {
  switch (raw) {
    case "SCHEDULED":
    case "TIMED":
      return "upcoming";
    case "IN_PLAY":
    case "PAUSED":
      return "live";
    case "FINISHED":
    case "AWARDED":
      return "finished";
    default:
      return "unknown";
  }
}

function teamName(team: FootballDataTeam | undefined): string {
  return team?.name ?? team?.shortName ?? "TBD";
}

function teamCode(team: FootballDataTeam | undefined): string {
  if (team?.tla) {
    return team.tla;
  }

  const label = team?.shortName ?? team?.name ?? "TBD";
  return label.slice(0, 3).toUpperCase();
}

/** Pure mapping from a football-data response to our normalized matches. */
export function normalizeFootballDataMatches(
  response: FootballDataMatchesResponse,
): LiveMatch[] {
  const matches = response.matches ?? [];

  return matches.map((match) => {
    const status = mapStatus(match.status);
    const minute = match.minute == null ? null : String(match.minute);

    return {
      id: String(match.id),
      status,
      utcDate: match.utcDate,
      stage: match.stage ?? null,
      homeName: teamName(match.homeTeam),
      homeCode: teamCode(match.homeTeam),
      awayName: teamName(match.awayTeam),
      awayCode: teamCode(match.awayTeam),
      homeScore: match.score?.fullTime?.home ?? null,
      awayScore: match.score?.fullTime?.away ?? null,
      minute: status === "live" ? minute : null,
    };
  });
}

const STATUS_ORDER: Record<LiveMatchStatus, number> = {
  live: 0,
  upcoming: 1,
  finished: 2,
  unknown: 3,
};

/**
 * Pure ordering for display: live first, then soonest upcoming, then most
 * recent finished. Capped to keep the strip compact.
 */
export function orderLiveMatches(
  matches: LiveMatch[],
  limit = LIVE_MAX_MATCHES,
): LiveMatch[] {
  return [...matches]
    .sort((left, right) => {
      const byStatus = STATUS_ORDER[left.status] - STATUS_ORDER[right.status];

      if (byStatus !== 0) {
        return byStatus;
      }

      const leftTime = Date.parse(left.utcDate);
      const rightTime = Date.parse(right.utcDate);

      // Finished matches read newest-first; everything else oldest-first.
      return left.status === "finished"
        ? rightTime - leftTime
        : leftTime - rightTime;
    })
    .slice(0, limit);
}

function isoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

/**
 * Fetch current/recent World Cup matches from football-data.org. `fetchImpl`
 * and `now` are injectable for tests. Throws on any provider/HTTP error so the
 * caller can fall back gracefully; never returns partial garbage.
 */
export async function fetchWorldCupScores(
  deps: { fetchImpl?: typeof fetch; now?: () => number } = {},
): Promise<LiveMatch[]> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const now = deps.now ?? Date.now;
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FOOTBALL_DATA_API_KEY");
  }

  const current = now();
  const dateFrom = isoDate(current - LIVE_WINDOW_DAYS_BACK * 86_400_000);
  const dateTo = isoDate(current + LIVE_WINDOW_DAYS_FORWARD * 86_400_000);
  const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${WORLD_CUP_COMPETITION}/matches?dateFrom=${dateFrom}&dateTo=${dateTo}`;

  const json = await requestMatches(url, fetchImpl, apiKey);
  return orderLiveMatches(normalizeFootballDataMatches(json));
}

/**
 * Fetch every FINISHED World Cup match of the current season (not just the
 * near-now window used by the live strip). This is the resolved-results feed
 * the calibration page grades against. Throws on any provider/HTTP error so the
 * caller can fall back to the synthetic illustration. Uses the SAME provider,
 * base URL, and competition code as {@link fetchWorldCupScores}.
 */
export async function fetchFinishedWorldCupMatches(
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<LiveMatch[]> {
  const fetchImpl = deps.fetchImpl ?? fetch;
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FOOTBALL_DATA_API_KEY");
  }

  const url = `${FOOTBALL_DATA_BASE_URL}/competitions/${WORLD_CUP_COMPETITION}/matches?status=FINISHED`;
  const json = await requestMatches(url, fetchImpl, apiKey);

  // Defensive: keep only genuinely finished matches even if the provider ignores
  // the status filter, so we never grade a forecast against an in-play score.
  return normalizeFootballDataMatches(json).filter(
    (match) => match.status === "finished",
  );
}

/**
 * Shared football-data GET: auth header, an 8s abort guard so a hanging provider
 * can't hang the route, and a thrown error on any non-2xx response.
 */
async function requestMatches(
  url: string,
  fetchImpl: typeof fetch,
  apiKey: string,
): Promise<FootballDataMatchesResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetchImpl(url, {
      headers: { "X-Auth-Token": apiKey },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`football-data responded ${response.status}`);
    }

    return (await response.json()) as FootballDataMatchesResponse;
  } finally {
    clearTimeout(timeout);
  }
}
