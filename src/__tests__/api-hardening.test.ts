import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { apiHandler } from "@/lib/api/handler";
import { handleRouteError } from "@/lib/api/http";
import {
  enforceRateLimit,
  getClientKey,
  rateLimitStoreSize,
  resetRateLimitStoreForTests,
  sweepExpiredBuckets,
} from "@/lib/api/rate-limit";
import { GET as healthGet } from "@/app/api/health/route";
import type { ApiResponse } from "@/lib/types";

async function body<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

describe("handleRouteError does not leak internal details", () => {
  it("returns a generic, sanitized 500 for an unexpected internal Error", async () => {
    const secret =
      "DB connection failed at 10.0.0.5 user=admin password=hunter2";
    const response = handleRouteError(new Error(secret));
    const payload = await body(response);

    expect(response.status).toBe(500);
    expect(payload.ok).toBe(false);

    if (!payload.ok) {
      expect(payload.error.code).toBe("INTERNAL_ERROR");
      expect(payload.error.message).toBe(
        "Something went wrong while processing the request.",
      );
    }

    // The raw message and every sensitive token in it must be absent from the
    // entire serialized response.
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain(secret);
    expect(serialized).not.toContain("password");
    expect(serialized).not.toContain("hunter2");
    expect(serialized).not.toContain("10.0.0.5");
  });

  it("does not expose a thrown Error's message through a wrapped route", async () => {
    const route = apiHandler(async () => {
      throw new Error("INTERNAL: secret stack detail from upstream service");
    });

    const response = await route(new Request("http://localhost/api/boom"));
    const payload = await body(response);

    expect(response.status).toBe(500);
    expect(JSON.stringify(payload)).not.toContain("secret stack detail");

    if (!payload.ok) {
      expect(payload.error.message).toBe(
        "Something went wrong while processing the request.",
      );
    }
  });

  it("still classifies validation and malformed-JSON errors precisely", async () => {
    const json = handleRouteError(new SyntaxError("Unexpected token < in JSON"));
    expect(json.status).toBe(400);
    const jsonPayload = await body(json);
    if (!jsonPayload.ok) {
      expect(jsonPayload.error.code).toBe("INVALID_JSON");
      // Never echoes the parser's positional detail.
      expect(jsonPayload.error.message).not.toContain("Unexpected token");
    }
  });
});

describe("rate limiter x-forwarded-for parsing", () => {
  const original = process.env.RATE_LIMIT_TRUST_PROXY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.RATE_LIMIT_TRUST_PROXY;
    } else {
      process.env.RATE_LIMIT_TRUST_PROXY = original;
    }
  });

  function requestWith(headers: Record<string, string>): Request {
    return new Request("http://localhost/api/x", { headers });
  }

  it("reads ONLY the last (trusted) hop when a trusted proxy is declared", () => {
    process.env.RATE_LIMIT_TRUST_PROXY = "true";

    expect(
      getClientKey(requestWith({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3" })),
    ).toBe("xff:3.3.3.3");

    // Spoofed leftmost hops differ but the trusted last hop is the same -> same
    // bucket, so an attacker cannot rotate the client-controlled prefix.
    const a = getClientKey(requestWith({ "x-forwarded-for": "9.9.9.9, 3.3.3.3" }));
    const b = getClientKey(
      requestWith({ "x-forwarded-for": "8.8.8.8, 7.7.7.7, 3.3.3.3" }),
    );
    expect(a).toBe(b);
    expect(a).toBe("xff:3.3.3.3");
  });

  it("ignores x-forwarded-for entirely without a trusted-proxy opt-in", () => {
    delete process.env.RATE_LIMIT_TRUST_PROXY;

    const key = getClientKey(
      requestWith({
        "x-forwarded-for": "3.3.3.3",
        "user-agent": "UA",
        "accept-language": "en",
      }),
    );

    // Falls back to the fingerprint, so a spoofed XFF cannot mint a new bucket.
    expect(key.startsWith("demo:")).toBe(true);
  });
});

describe("rate limiter bucket eviction", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
    delete process.env.RATE_LIMIT_TRUST_PROXY;
  });

  function fingerprintRequest(agent: string): Request {
    return new Request("http://localhost/api/x", {
      headers: { "user-agent": agent, "accept-language": "en" },
    });
  }

  it("sweepExpiredBuckets removes only elapsed buckets", () => {
    for (const agent of ["A", "B", "C"]) {
      enforceRateLimit(fingerprintRequest(agent), {
        keyPrefix: "evict",
        limit: 5,
        windowMs: 1000,
        now: 1000,
      });
    }

    expect(rateLimitStoreSize()).toBe(3);

    // Before expiry: nothing swept.
    expect(sweepExpiredBuckets(1500)).toBe(0);
    expect(rateLimitStoreSize()).toBe(3);

    // After the window (resetAt = 2000): all three evicted.
    expect(sweepExpiredBuckets(2001)).toBe(3);
    expect(rateLimitStoreSize()).toBe(0);
  });

  it("enforceRateLimit self-evicts expired buckets so the Map stays bounded", () => {
    for (const agent of ["A", "B", "C"]) {
      enforceRateLimit(fingerprintRequest(agent), {
        keyPrefix: "evict",
        limit: 5,
        windowMs: 1000,
        now: 1000,
      });
    }
    expect(rateLimitStoreSize()).toBe(3);

    // A request far in the future trips the time-based sweep: the three stale
    // buckets are dropped and only the new one remains.
    enforceRateLimit(fingerprintRequest("D"), {
      keyPrefix: "evict",
      limit: 5,
      windowMs: 1000,
      now: 100_000,
    });

    expect(rateLimitStoreSize()).toBe(1);
  });
});

describe("/api/health", () => {
  it("returns build/mode metadata with a correlation id and no secrets", async () => {
    const response = await healthGet(
      new Request("http://localhost/api/health"),
    );
    const payload = await body<{
      status: string;
      version: string;
      datasetMode: string;
      providerMode: string;
    }>(response);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(payload.ok).toBe(true);

    if (payload.ok) {
      expect(payload.data.status).toBe("ok");
      expect(typeof payload.data.version).toBe("string");
      expect(payload.data.datasetMode).toBe("sample");
      expect([
        "SAMPLE_DATASET_MODE",
        "OFFLINE_DATASET_MODE",
        "LIVE_PROVIDER_MODE",
      ]).toContain(payload.data.providerMode);
    }

    const serialized = JSON.stringify(payload);
    expect(serialized).not.toMatch(/api[_-]?key/i);
    // If a real key is configured, prove its value never appears in the body.
    const key = process.env.FOOTBALL_DATA_API_KEY;
    if (key) {
      expect(serialized).not.toContain(key);
    }
  });

  it("propagates a safe inbound x-request-id but rejects an unsafe one", async () => {
    const ok = await healthGet(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": "trace-abc123" },
      }),
    );
    expect(ok.headers.get("x-request-id")).toBe("trace-abc123");
    const okPayload = await body(ok);
    expect(okPayload.meta.requestId).toBe("trace-abc123");

    const unsafe = await healthGet(
      new Request("http://localhost/api/health", {
        headers: { "x-request-id": "bad id with spaces & symbols!" },
      }),
    );
    expect(unsafe.headers.get("x-request-id")).not.toBe(
      "bad id with spaces & symbols!",
    );
  });
});
