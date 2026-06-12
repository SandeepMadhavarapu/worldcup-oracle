import { beforeEach, describe, expect, it } from "vitest";

import { GET as calibrationGet } from "@/app/api/calibration/route";
import { POST as predictMatchPost } from "@/app/api/predict-match/route";
import { POST as simulateTournamentPost } from "@/app/api/simulate-tournament/route";
import { GET as teamPathGet } from "@/app/api/team-path/route";
import { enforceRateLimit, resetRateLimitStoreForTests } from "@/lib/api/rate-limit";
import type { CalibrationReport } from "@/lib/calibration/types";
import { MAX_PUBLIC_SIMULATIONS } from "@/lib/tournament/constants";
import type { TeamPathReport } from "@/lib/tournament/team-path";
import type { ApiResponse } from "@/lib/types";

async function parse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

describe("api route validation", () => {
  beforeEach(() => {
    resetRateLimitStoreForTests();
  });

  it("rejects invalid match prediction input with a typed error envelope", async () => {
    const response = await predictMatchPost(
      new Request("http://localhost/api/predict-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAId: "argentina", teamBId: "argentina" }),
      }),
    );
    const payload = await parse(response);

    expect(response.status).toBe(422);
    expect(payload.ok).toBe(false);
    expect(payload.ok ? "" : payload.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects oversized simulation requests", async () => {
    const startedAt = performance.now();
    const response = await simulateTournamentPost(
      new Request("http://localhost/api/simulate-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iterations: MAX_PUBLIC_SIMULATIONS + 1,
          seed: "too-many",
        }),
      }),
    );
    const elapsedMs = performance.now() - startedAt;
    const payload = await parse(response);

    expect(response.status).toBe(422);
    expect(payload.ok).toBe(false);
    expect(elapsedMs).toBeLessThan(500);
  });

  it("allows the public max simulation count", async () => {
    const startedAt = performance.now();
    const response = await simulateTournamentPost(
      new Request("http://localhost/api/simulate-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          iterations: MAX_PUBLIC_SIMULATIONS,
          seed: "max-public",
        }),
      }),
    );
    const elapsedMs = performance.now() - startedAt;
    const payload = await parse<{ simulation: { iterations: number } }>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.ok ? payload.data.simulation.iterations : 0).toBe(
      MAX_PUBLIC_SIMULATIONS,
    );
    expect(elapsedMs).toBeLessThan(10_000);
  });

  it("returns a typed success envelope for valid simulation requests", async () => {
    const response = await simulateTournamentPost(
      new Request("http://localhost/api/simulate-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iterations: 2, seed: "api-test" }),
      }),
    );
    const payload = await parse<{ simulation: { iterations: number } }>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.ok ? payload.data.simulation.iterations : 0).toBe(2);
  });

  it("returns a friendly malformed JSON error without parser details", async () => {
    const response = await predictMatchPost(
      new Request("http://localhost/api/predict-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{\"teamAId\":\"argentina\",",
      }),
    );
    const payload = await parse(response);

    expect(response.status).toBe(400);
    expect(payload.ok).toBe(false);

    if (!payload.ok) {
      expect(payload.error.code).toBe("INVALID_JSON");
      expect(payload.error.message).toBe(
        "Invalid JSON body. Please check the request payload.",
      );
      expect(payload.error.message).not.toContain("position");
      expect(payload.error.message).not.toContain("Unexpected");
    }
  });

  it("rate limits repeated demo requests", async () => {
    const options = {
      keyPrefix: "test-repeat",
      limit: 2,
      windowMs: 60_000,
    };
    const request = new Request("http://localhost/api/predict-match", {
      headers: { "User-Agent": "rate-test" },
    });

    expect(enforceRateLimit(request, options)).toBeNull();
    expect(enforceRateLimit(request, options)).toBeNull();

    const limited = enforceRateLimit(request, options);

    expect(limited?.status).toBe(429);
  });

  it("does not let spoofed X-Forwarded-For alone bypass the demo limiter", async () => {
    const options = {
      keyPrefix: "test-spoof",
      limit: 2,
      windowMs: 60_000,
    };

    for (let index = 0; index < 2; index += 1) {
      const allowed = enforceRateLimit(
        new Request("http://localhost/api/predict-match", {
          headers: {
            "User-Agent": "spoof-test",
            "Accept-Language": "en-US",
            "X-Forwarded-For": `203.0.113.${index}`,
          },
        }),
        options,
      );

      expect(allowed).toBeNull();
    }

    const limited = enforceRateLimit(
      new Request("http://localhost/api/predict-match", {
        headers: {
          "User-Agent": "spoof-test",
          "Accept-Language": "en-US",
          "X-Forwarded-For": "203.0.113.200",
        },
      }),
      options,
    );

    expect(limited?.status).toBe(429);
  });

  it("returns a typed calibration report sourced from resolved matches", async () => {
    const response = await calibrationGet(
      new Request("http://localhost/api/calibration"),
    );
    const payload = await parse<{
      synthetic: boolean;
      source: string;
      resolvedCount: number;
      label: string;
      report: CalibrationReport;
    }>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    if (payload.ok) {
      // No live provider key in the test env, so the route falls back to the
      // clearly-labeled synthetic illustration — never silently mixed.
      expect(payload.data.synthetic).toBe(true);
      expect(payload.data.source).toBe("illustrative");
      expect(payload.data.resolvedCount).toBe(0);
      expect(payload.data.label).toBe(
        "Illustrative — no real matches resolved yet",
      );
      expect(payload.data.report.buckets).toHaveLength(10);
      expect(payload.data.report.sampleSize).toBeGreaterThan(0);
      expect(payload.data.report.brierScore).not.toBeNull();
      const brier = payload.data.report.brierScore ?? -1;
      expect(brier).toBeGreaterThanOrEqual(0);
      expect(brier).toBeLessThanOrEqual(2);
      // Deterministic seed -> stable sample size across runs.
      expect(payload.data.report.sampleSize).toBe(90);
    }
  });

  it("returns a team's upset path from the cached baseline simulation", async () => {
    const response = await teamPathGet(
      new Request("http://localhost/api/team-path?teamId=argentina"),
    );
    const payload = await parse<{ path: TeamPathReport }>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    if (payload.ok) {
      const path = payload.data.path;
      expect(path.teamId).toBe("argentina");
      expect(path.championProbability).toBeGreaterThanOrEqual(0);
      expect(path.championProbability).toBeLessThanOrEqual(1);
      // Winning the title requires reaching the final, so final >= champion.
      expect(path.finalProbability).toBeGreaterThanOrEqual(
        path.championProbability,
      );

      if (path.hasTitleRun) {
        expect(path.steps.length).toBeGreaterThan(0);
        expect(path.steps.at(-1)?.round).toBe("Final");
        expect(path.modalShare).toBeGreaterThan(0);
        expect(path.modalShare).toBeLessThanOrEqual(1);
        for (const step of path.steps) {
          expect(step.opponentName.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("rejects a team-path request with a missing or unknown team", async () => {
    const missing = await teamPathGet(
      new Request("http://localhost/api/team-path"),
    );
    expect(missing.status).toBe(422);

    const unknown = await teamPathGet(
      new Request("http://localhost/api/team-path?teamId=atlantis"),
    );
    expect(unknown.status).toBe(422);
  });
});
