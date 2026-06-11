// Process-wide singleton: one cached live-scores value shared across all
// requests, refreshed at most once per TTL window. This is what guarantees we
// never exceed the free-tier rate limit no matter how many clients poll.

import { createTtlCache } from "@/lib/live/cache";
import { LIVE_CACHE_TTL_MS } from "@/lib/live/constants";
import { loadLiveScores } from "@/lib/live/scores";
import type { LiveScoresPayload } from "@/lib/live/types";

const liveScoresCache = createTtlCache<LiveScoresPayload>({
  ttlMs: LIVE_CACHE_TTL_MS,
  load: () => loadLiveScores(),
});

export function getLiveScores(): Promise<LiveScoresPayload> {
  return liveScoresCache.get();
}
