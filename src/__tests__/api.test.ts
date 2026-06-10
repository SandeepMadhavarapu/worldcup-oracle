import { describe, expect, it } from "vitest";

import { GET as calibrationGet } from "@/app/api/calibration/route";
import { POST as predictMatchPost } from "@/app/api/predict-match/route";
import { POST as simulateTournamentPost } from "@/app/api/simulate-tournament/route";
import type { CalibrationReport } from "@/lib/calibration/types";
import type { ApiResponse } from "@/lib/types";

async function parse<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

describe("api route validation", () => {
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
    const response = await simulateTournamentPost(
      new Request("http://localhost/api/simulate-tournament", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iterations: 10001, seed: "too-many" }),
      }),
    );
    const payload = await parse(response);

    expect(response.status).toBe(422);
    expect(payload.ok).toBe(false);
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

  it("returns a typed calibration report sourced from resolved matches", async () => {
    const response = await calibrationGet();
    const payload = await parse<{
      synthetic: boolean;
      report: CalibrationReport;
    }>(response);

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);

    if (payload.ok) {
      expect(payload.data.synthetic).toBe(true);
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
});
