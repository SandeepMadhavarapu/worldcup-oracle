// Process-wide cache for real resolved results. Finished scores change only
// when a match ends, so a longer TTL than the live strip is fine and keeps us
// well under football-data.org's free-tier rate limit no matter how many people
// load the calibration page.

import { createTtlCache } from "@/lib/live/cache";
import { loadLiveResolvedMatches } from "@/lib/calibration/live-results";
import type { ResolvedMatch } from "@/lib/calibration/types";

const RESOLVED_RESULTS_TTL_MS = 5 * 60 * 1000;

const resolvedResultsCache = createTtlCache<ResolvedMatch[]>({
  ttlMs: RESOLVED_RESULTS_TTL_MS,
  load: () => loadLiveResolvedMatches(),
});

export function getLiveResolvedMatches(): Promise<ResolvedMatch[]> {
  return resolvedResultsCache.get();
}
