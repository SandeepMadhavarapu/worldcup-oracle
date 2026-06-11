// Builds the LiveScoresPayload the API serves. Wraps the provider call so it
// NEVER throws — any missing key or provider error becomes a clearly-labeled
// "unavailable" payload, so the page can never crash on live scores.

import {
  LIVE_LABEL,
  LIVE_REFRESH_SECONDS,
  UNAVAILABLE_NO_KEY,
  UNAVAILABLE_PROVIDER_ERROR,
} from "@/lib/live/constants";
import { fetchWorldCupScores } from "@/lib/live/football-data";
import type { LiveScoresPayload } from "@/lib/live/types";
import { getProviderMode, getProviderNotice } from "@/lib/data";

export async function loadLiveScores(
  deps: { fetchImpl?: typeof fetch; now?: () => number } = {},
): Promise<LiveScoresPayload> {
  const now = deps.now ?? Date.now;
  const providerMode = getProviderMode();
  const base = {
    providerMode,
    refreshSeconds: LIVE_REFRESH_SECONDS,
    label: LIVE_LABEL,
    // The existing dataset-mode notice is passed through unchanged.
    notice: getProviderNotice(),
    fetchedAt: new Date(now()).toISOString(),
  };

  if (providerMode !== "LIVE_PROVIDER_MODE") {
    return {
      ...base,
      status: "unavailable",
      reason: UNAVAILABLE_NO_KEY,
      matches: [],
    };
  }

  try {
    const matches = await fetchWorldCupScores({
      fetchImpl: deps.fetchImpl,
      now: deps.now,
    });

    return { ...base, status: "available", reason: null, matches };
  } catch {
    return {
      ...base,
      status: "unavailable",
      reason: UNAVAILABLE_PROVIDER_ERROR,
      matches: [],
    };
  }
}
