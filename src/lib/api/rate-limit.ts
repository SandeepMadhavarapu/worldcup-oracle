import { jsonError } from "@/lib/api/http";

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

export function getClientKey(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  return forwardedFor?.split(",")[0]?.trim() || realIp || "local-dev";
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
