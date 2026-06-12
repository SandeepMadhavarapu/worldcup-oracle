import { jsonError } from "@/lib/api/http";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Eviction so the in-memory store can't grow without bound across many distinct
// clients: opportunistically sweep expired buckets on a time interval, and force
// a sweep if the store somehow balloons past a hard cap.
const SWEEP_INTERVAL_MS = 60_000;
const MAX_BUCKETS = 10_000;
let lastSweepAt = 0;

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
}

/**
 * The LAST hop of a forwarded-for chain. With a single trusted reverse proxy in
 * front, the rightmost entry is the IP the proxy actually observed; the leftmost
 * entries are client-supplied and spoofable. So we read the last hop, never the
 * first.
 */
function lastForwardedHop(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const hops = value
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);

  return hops.length > 0 ? hops[hops.length - 1] : null;
}

/**
 * x-forwarded-for is only trusted when the deployment explicitly opts in
 * (RATE_LIMIT_TRUST_PROXY=true), i.e. when a trusted proxy is known to be
 * rewriting the header. Without that, the header is attacker-controlled and is
 * ignored in favor of the request fingerprint.
 */
function trustsForwardedFor(): boolean {
  return process.env.RATE_LIMIT_TRUST_PROXY === "true";
}

function stableHash(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}

export function getClientKey(request: Request): string {
  const headers = request.headers;
  const vercelIp = firstHeaderValue(headers.get("x-vercel-forwarded-for"));
  const cloudflareIp = firstHeaderValue(headers.get("cf-connecting-ip"));
  const flyIp = firstHeaderValue(headers.get("fly-client-ip"));

  // These headers are trusted only with platform marker headers that public
  // clients cannot normally set once the app is behind that provider. This is
  // still an in-memory demo limiter, not a distributed production control.
  if (headers.get("x-vercel-id") && vercelIp) {
    return `vercel:${vercelIp}`;
  }

  if (headers.get("cf-ray") && cloudflareIp) {
    return `cloudflare:${cloudflareIp}`;
  }

  if (headers.get("fly-region") && flyIp) {
    return `fly:${flyIp}`;
  }

  // Generic reverse proxy: trust ONLY the last x-forwarded-for hop, and only
  // when the operator has declared the proxy trusted.
  if (trustsForwardedFor()) {
    const forwarded = lastForwardedHop(headers.get("x-forwarded-for"));
    if (forwarded) {
      return `xff:${forwarded}`;
    }
  }

  const fallbackFingerprint = [
    headers.get("user-agent") ?? "unknown-user-agent",
    headers.get("accept-language") ?? "unknown-language",
  ].join("|");

  return `demo:${stableHash(fallbackFingerprint)}`;
}

/**
 * Delete every bucket whose window has elapsed. Exported for tests and called
 * opportunistically by the limiter.
 */
export function sweepExpiredBuckets(now: number = Date.now()): number {
  let removed = 0;

  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) {
      store.delete(key);
      removed += 1;
    }
  }

  return removed;
}

function maybeSweep(now: number): void {
  if (now - lastSweepAt >= SWEEP_INTERVAL_MS || store.size > MAX_BUCKETS) {
    sweepExpiredBuckets(now);
    lastSweepAt = now;
  }
}

export function enforceRateLimit(
  request: Request,
  options: {
    keyPrefix: string;
    limit: number;
    windowMs: number;
    /** Injectable clock for deterministic tests. */
    now?: number;
  },
): Response | null {
  const now = options.now ?? Date.now();
  maybeSweep(now);

  const key = `${options.keyPrefix}:${getClientKey(request)}`;
  const bucket = store.get(key);

  if (!bucket || bucket.resetAt <= now) {
    store.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return null;
  }

  bucket.count += 1;

  if (bucket.count > options.limit) {
    return jsonError(
      "RATE_LIMITED",
      "Too many requests. Wait a moment and try again.",
      429,
      {
        retryAfterMs: Math.max(0, bucket.resetAt - now),
      },
    );
  }

  return null;
}

/** Current number of tracked buckets — for tests/observability. */
export function rateLimitStoreSize(): number {
  return store.size;
}

export function resetRateLimitStoreForTests(): void {
  store.clear();
  lastSweepAt = 0;
}
