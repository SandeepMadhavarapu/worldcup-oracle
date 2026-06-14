import { describe, expect, it } from "vitest";

import { selectCalibrationSource } from "@/lib/calibration/source";
import type { ResolvedMatch } from "@/lib/calibration/types";
import {
  buildCalibrationEvidenceRows,
  buildFixtureFreshnessStatus,
  buildProviderConnectionStatus,
  formatPercent,
} from "@/lib/data-center/summary";
import type { LiveScoresPayload } from "@/lib/live/types";

function liveScoresPayload(
  overrides: Partial<LiveScoresPayload> = {},
): LiveScoresPayload {
  return {
    status: "unavailable",
    providerMode: "SAMPLE_DATASET_MODE",
    refreshSeconds: 45,
    label: "Near-live, ~45s refresh",
    notice: "Sample provider mode.",
    reason: "No live provider configured.",
    fetchedAt: "2026-06-14T00:00:00.000Z",
    matches: [],
    ...overrides,
  };
}

describe("data credibility center helpers", () => {
  it("reports football-data as connected only when selected and keyed", () => {
    expect(
      buildProviderConnectionStatus({
        LIVE_DATA_PROVIDER: "football-data",
        FOOTBALL_DATA_API_KEY: "set",
      }),
    ).toMatchObject({
      selectedProvider: "football-data",
      footballDataConnected: true,
      liveProviderAvailable: true,
    });

    expect(
      buildProviderConnectionStatus({
        LIVE_DATA_PROVIDER: "football-data",
      }),
    ).toMatchObject({
      selectedProvider: "football-data",
      footballDataConnected: false,
      liveProviderAvailable: false,
    });

    expect(
      buildProviderConnectionStatus({
        LIVE_DATA_PROVIDER: "none",
        FOOTBALL_DATA_API_KEY: "set",
      }),
    ).toMatchObject({
      selectedProvider: "none",
      footballDataConnected: false,
      liveProviderAvailable: false,
    });
  });

  it("formats data-center percentages consistently", () => {
    expect(formatPercent(0.4212)).toBe("42.1%");
    expect(formatPercent(0.4212, 2)).toBe("42.12%");
  });

  it("summarizes static fixture freshness without implying completeness", () => {
    const freshness = buildFixtureFreshnessStatus(liveScoresPayload());

    expect(freshness.headline).toBe(
      "Curated static seed - incomplete official fixture set",
    );
    expect(freshness.curatedFixtureCount).toBeGreaterThanOrEqual(2);
    expect(freshness.completedCuratedResultCount).toBe(1);
    expect(freshness.placeholderCount).toBeGreaterThan(0);
    expect(freshness.liveProviderRowCount).toBe(0);
    expect(freshness.staticDatasetIncomplete).toBe(true);
    expect(freshness.liveProviderAvailable).toBe(false);
    expect(freshness.detail).toContain("Provider unavailable");
  });

  it("reports live provider rows when the provider is available", () => {
    const freshness = buildFixtureFreshnessStatus(
      liveScoresPayload({
        status: "available",
        providerMode: "LIVE_PROVIDER_MODE",
        reason: null,
        matches: [
          {
            id: "provider-match-1",
            status: "finished",
            utcDate: "2026-06-12T01:00:00.000Z",
            stage: "Group Stage",
            homeName: "Mexico",
            homeCode: "MEX",
            awayName: "South Africa",
            awayCode: "RSA",
            homeScore: 2,
            awayScore: 0,
            minute: null,
          },
        ],
      }),
    );

    expect(freshness.headline).toBe("Live provider connected");
    expect(freshness.liveProviderRowCount).toBe(1);
    expect(freshness.liveProviderAvailable).toBe(true);
    expect(freshness.sourceKind).toBe("live");
  });

  it("labels calibration evidence as illustrative when real matches are absent", () => {
    const synthetic: ResolvedMatch[] = [
      {
        id: "demo-1",
        homeTeamId: "argentina",
        awayTeamId: "france",
        predicted: { win: 0.55, draw: 0.22, loss: 0.23 },
        actual: "win",
        kickoff: "2026-01-01T00:00:00.000Z",
      },
    ];
    const source = selectCalibrationSource([], synthetic);
    const rows = buildCalibrationEvidenceRows(source);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      match: "Argentina vs France",
      predictedPick: "Home win (55.0%)",
      actual: "Home win",
      sourceKind: "illustrative",
    });
    expect(rows[0].brier).toBe("0.304");
  });
});
