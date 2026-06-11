import type { ProviderMode } from "@/lib/types";

export type LiveMatchStatus = "upcoming" | "live" | "finished" | "unknown";

export interface LiveMatch {
  id: string;
  status: LiveMatchStatus;
  /** ISO kickoff time (UTC). */
  utcDate: string;
  stage: string | null;
  homeName: string;
  homeCode: string;
  awayName: string;
  awayCode: string;
  homeScore: number | null;
  awayScore: number | null;
  /** Elapsed minute label for live matches (e.g. "67"), else null. */
  minute: string | null;
}

export type LiveScoresStatus = "available" | "unavailable";

export interface LiveScoresPayload {
  status: LiveScoresStatus;
  providerMode: ProviderMode;
  refreshSeconds: number;
  /** Honest cadence label, e.g. "Near-live, ~45s refresh". */
  label: string;
  /** The existing dataset-mode notice, passed through unchanged. */
  notice: string;
  /** Why scores are unavailable, when status is "unavailable". */
  reason: string | null;
  fetchedAt: string;
  matches: LiveMatch[];
}
