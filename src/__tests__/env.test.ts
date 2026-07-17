import { afterEach, describe, expect, it } from "vitest";

import { readLiveDataProvider, readRateLimitTrustProxy } from "@/lib/env";
import { getProviderMode } from "@/lib/data/provider-mode";

const originalProvider = process.env.LIVE_DATA_PROVIDER;
const originalTrustProxy = process.env.RATE_LIMIT_TRUST_PROXY;

afterEach(() => {
  if (originalProvider === undefined) {
    delete process.env.LIVE_DATA_PROVIDER;
  } else {
    process.env.LIVE_DATA_PROVIDER = originalProvider;
  }

  if (originalTrustProxy === undefined) {
    delete process.env.RATE_LIMIT_TRUST_PROXY;
  } else {
    process.env.RATE_LIMIT_TRUST_PROXY = originalTrustProxy;
  }
});

describe("environment validation", () => {
  it("defaults to 'none' when LIVE_DATA_PROVIDER is unset or empty", () => {
    delete process.env.LIVE_DATA_PROVIDER;
    expect(readLiveDataProvider()).toBe("none");

    process.env.LIVE_DATA_PROVIDER = "";
    expect(readLiveDataProvider()).toBe("none");
  });

  it("accepts the supported provider value", () => {
    process.env.LIVE_DATA_PROVIDER = "football-data";
    expect(readLiveDataProvider()).toBe("football-data");
  });

  it("throws loudly on a misspelled provider instead of silently degrading", () => {
    process.env.LIVE_DATA_PROVIDER = "footbal-data";
    expect(() => readLiveDataProvider()).toThrow(/Invalid LIVE_DATA_PROVIDER/);
    expect(() => getProviderMode()).toThrow(/Invalid LIVE_DATA_PROVIDER/);
  });

  it("rejects the removed api-football provider value", () => {
    process.env.LIVE_DATA_PROVIDER = "api-football";
    expect(() => readLiveDataProvider()).toThrow(/Invalid LIVE_DATA_PROVIDER/);
  });

  it("parses the rate-limit trust flag strictly", () => {
    delete process.env.RATE_LIMIT_TRUST_PROXY;
    expect(readRateLimitTrustProxy()).toBe(false);

    process.env.RATE_LIMIT_TRUST_PROXY = "true";
    expect(readRateLimitTrustProxy()).toBe(true);

    process.env.RATE_LIMIT_TRUST_PROXY = "false";
    expect(readRateLimitTrustProxy()).toBe(false);

    process.env.RATE_LIMIT_TRUST_PROXY = "yes";
    expect(() => readRateLimitTrustProxy()).toThrow(
      /Invalid RATE_LIMIT_TRUST_PROXY/,
    );
  });
});
