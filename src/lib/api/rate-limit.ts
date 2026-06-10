import { jsonError } from "@/lib/api/http";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

function firstHeaderValue(value: string | null): string | null {
  return value?.split(",")[0]?.trim() || null;
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

  const fallbackFingerprint = [
    headers.get("user-agent") ?? "unknown-user-agent",
    headers.get("accept-language") ?? "unknown-language",
  ].join("|");

  return `demo:${stableHash(fallbackFingerprint)}`;
}

export function enforceRateLimit(
  request: Request,
  options: {
    keyPrefix: string;
    limit: number;
    windowMs: number;
  },
): Response | null {
  const now = Date.now();
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

export function resetRateLimitStoreForTests(): void {
  store.clear();
}
