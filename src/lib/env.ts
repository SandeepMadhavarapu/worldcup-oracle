// Lazy, loud environment validation.
//
// A misspelled value must fail with a clear error the first time the server
// reads it — never silently degrade to a different mode. (A silently-blank or
// silently-defaulted config value is the same failure class as signing tokens
// with an empty secret: the wrong thing should be impossible, not quiet.)
//
// Validation is performed on READ rather than at module load so test suites
// can set and unset process.env between cases.

import { z } from "zod";

const liveDataProviderSchema = z
  .enum(["none", "football-data"])
  .optional()
  .default("none");

const booleanFlagSchema = z.enum(["true", "false"]).optional();

export function readLiveDataProvider(): "none" | "football-data" {
  const raw = process.env.LIVE_DATA_PROVIDER;
  const parsed = liveDataProviderSchema.safeParse(
    raw === undefined || raw === "" ? undefined : raw,
  );

  if (!parsed.success) {
    throw new Error(
      `Invalid LIVE_DATA_PROVIDER value ${JSON.stringify(raw)}. ` +
        `Expected "none" or "football-data". Refusing to guess a dataset mode.`,
    );
  }

  return parsed.data;
}

export function readRateLimitTrustProxy(): boolean {
  const raw = process.env.RATE_LIMIT_TRUST_PROXY;
  const parsed = booleanFlagSchema.safeParse(
    raw === undefined || raw === "" ? undefined : raw,
  );

  if (!parsed.success) {
    throw new Error(
      `Invalid RATE_LIMIT_TRUST_PROXY value ${JSON.stringify(raw)}. ` +
        `Expected "true" or "false".`,
    );
  }

  return parsed.data === "true";
}
