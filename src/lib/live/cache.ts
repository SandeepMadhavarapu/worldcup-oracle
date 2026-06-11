// A tiny TTL cache with in-flight de-duplication. Pure and clock-injectable so
// the TTL behavior is unit-testable without timers or network. Used to throttle
// provider calls to at most one per TTL window regardless of client count.

export interface TtlCache<T> {
  get(): Promise<T>;
  invalidate(): void;
}

export function createTtlCache<T>({
  ttlMs,
  load,
  now = () => Date.now(),
}: {
  ttlMs: number;
  load: () => Promise<T>;
  now?: () => number;
}): TtlCache<T> {
  let entry: { value: T; storedAt: number } | null = null;
  let inFlight: Promise<T> | null = null;

  return {
    async get() {
      if (entry && now() - entry.storedAt < ttlMs) {
        return entry.value;
      }

      // Coalesce concurrent refreshes into a single load.
      if (inFlight) {
        return inFlight;
      }

      inFlight = (async () => {
        try {
          const value = await load();
          entry = { value, storedAt: now() };
          return value;
        } finally {
          inFlight = null;
        }
      })();

      return inFlight;
    },
    invalidate() {
      entry = null;
      inFlight = null;
    },
  };
}
