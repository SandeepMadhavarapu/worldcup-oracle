// Shared constants for the near-live score feature. The cache TTL and the
// client poll interval are intentionally the SAME value so the server cache
// absorbs every client poll — the provider is hit at most once per window no
// matter how many clients are polling, keeping us under football-data.org's
// free-tier rate limit.

export const LIVE_REFRESH_SECONDS = 45;
export const LIVE_CACHE_TTL_MS = LIVE_REFRESH_SECONDS * 1000;

// Honest labeling — never imply instant updates.
export const LIVE_LABEL = "Near-live, ~45s refresh";

export const UNAVAILABLE_NO_KEY =
  "Live scores need a football-data.org API key on the server. Showing the offline dataset instead.";
export const UNAVAILABLE_PROVIDER_ERROR =
  "The live provider is temporarily unavailable. Scores resume automatically.";

// football-data.org v4 — World Cup competition code is "WC". Free tier only.
export const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
export const WORLD_CUP_COMPETITION = "WC";

// How many days around "now" to request and how many matches to surface.
export const LIVE_WINDOW_DAYS_BACK = 3;
export const LIVE_WINDOW_DAYS_FORWARD = 10;
export const LIVE_MAX_MATCHES = 12;
