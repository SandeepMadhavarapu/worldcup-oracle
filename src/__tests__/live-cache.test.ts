import { describe, expect, it } from "vitest";

import { createTtlCache } from "@/lib/live/cache";

describe("createTtlCache", () => {
  it("serves a cached value within the TTL and reloads once it expires", async () => {
    let clock = 0;
    let calls = 0;
    const cache = createTtlCache<number>({
      ttlMs: 1000,
      now: () => clock,
      load: async () => {
        calls += 1;
        return calls;
      },
    });

    expect(await cache.get()).toBe(1);
    expect(calls).toBe(1);

    // within the window -> cached, no reload
    clock = 999;
    expect(await cache.get()).toBe(1);
    expect(calls).toBe(1);

    // at/after the window -> reload
    clock = 1000;
    expect(await cache.get()).toBe(2);
    expect(calls).toBe(2);
  });

  it("coalesces concurrent gets into a single load (no stampede)", async () => {
    let calls = 0;
    let resolveLoad!: (value: number) => void;
    const pending = new Promise<number>((resolve) => {
      resolveLoad = resolve;
    });
    const cache = createTtlCache<number>({
      ttlMs: 1000,
      now: () => 0,
      load: () => {
        calls += 1;
        return pending;
      },
    });

    const first = cache.get();
    const second = cache.get();

    expect(calls).toBe(1);

    resolveLoad(7);
    expect(await first).toBe(7);
    expect(await second).toBe(7);
    expect(calls).toBe(1);
  });

  it("reloads after invalidate()", async () => {
    let calls = 0;
    const cache = createTtlCache<number>({
      ttlMs: 100_000,
      now: () => 0,
      load: async () => {
        calls += 1;
        return calls;
      },
    });

    expect(await cache.get()).toBe(1);
    cache.invalidate();
    expect(await cache.get()).toBe(2);
  });
});
