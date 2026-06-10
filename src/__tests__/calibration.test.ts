import { describe, expect, it } from "vitest";

import {
  BUCKET_COUNT,
  brierScore,
  bucketIndex,
  buildCalibrationReport,
  buildReliabilityDiagram,
  matchBrier,
  outcomeVector,
  runningBrierScore,
} from "@/lib/calibration/calibration";
import type { ResolvedMatch } from "@/lib/calibration/types";

function match(
  id: string,
  win: number,
  draw: number,
  loss: number,
  actual: ResolvedMatch["actual"],
): ResolvedMatch {
  return {
    id,
    homeTeamId: "home",
    awayTeamId: "away",
    predicted: { win, draw, loss },
    actual,
    kickoff: "2026-01-01T00:00:00.000Z",
  };
}

// A small, fully hand-verifiable fixture. Per class (win/draw/loss) the four
// forecasts land in fixed buckets:
//   win  p=0.7 -> bucket 7, observed = 2/4 wins  = 0.50
//   draw p=0.2 -> bucket 2, observed = 1/4 draws = 0.25
//   loss p=0.1 -> bucket 1, observed = 1/4 losses= 0.25
const fixture: ResolvedMatch[] = [
  match("m1", 0.7, 0.2, 0.1, "win"),
  match("m2", 0.7, 0.2, 0.1, "win"),
  match("m3", 0.7, 0.2, 0.1, "loss"),
  match("m4", 0.7, 0.2, 0.1, "draw"),
];

describe("calibration outcome vector", () => {
  it("one-hot encodes win/draw/loss as [win, draw, loss]", () => {
    expect(outcomeVector("win")).toEqual([1, 0, 0]);
    expect(outcomeVector("draw")).toEqual([0, 1, 0]);
    expect(outcomeVector("loss")).toEqual([0, 0, 1]);
  });
});

describe("calibration bucketing", () => {
  it("maps probabilities to fixed-width buckets with an inclusive top edge", () => {
    expect(bucketIndex(0)).toBe(0);
    expect(bucketIndex(0.05)).toBe(0);
    expect(bucketIndex(0.1)).toBe(1);
    expect(bucketIndex(0.95)).toBe(9);
    expect(bucketIndex(1)).toBe(BUCKET_COUNT - 1);
  });

  it("clamps out-of-range probabilities and rejects non-finite input", () => {
    expect(bucketIndex(-0.2)).toBe(0);
    expect(bucketIndex(1.4)).toBe(9);
    expect(() => bucketIndex(Number.NaN)).toThrow();
  });
});

describe("multi-class Brier score", () => {
  it("scores a single match against the one-hot outcome", () => {
    expect(matchBrier(match("a", 1, 0, 0, "win"))).toBeCloseTo(0, 10);
    expect(matchBrier(match("b", 0, 0, 1, "win"))).toBeCloseTo(2, 10);
    expect(matchBrier(match("c", 1 / 3, 1 / 3, 1 / 3, "win"))).toBeCloseTo(
      2 / 3,
      10,
    );
  });

  it("averages over the fixture to the hand-computed mean", () => {
    // .14 + .14 + 1.34 + 1.14 = 2.76 ; mean = 0.69
    expect(brierScore(fixture)).toBeCloseTo(0.69, 10);
  });

  it("returns null for an empty set", () => {
    expect(brierScore([])).toBeNull();
  });
});

describe("running Brier score", () => {
  it("reports the cumulative mean after each match in order", () => {
    const running = runningBrierScore(fixture);

    expect(running.map((point) => point.matchId)).toEqual([
      "m1",
      "m2",
      "m3",
      "m4",
    ]);
    expect(running[0].brier).toBeCloseTo(0.14, 10);
    expect(running[1].brier).toBeCloseTo(0.14, 10);
    expect(running[2].brier).toBeCloseTo(1.62 / 3, 10);
    expect(running[3].brier).toBeCloseTo(0.69, 10);
  });
});

describe("reliability diagram", () => {
  it("always returns BUCKET_COUNT buckets with correct ranges", () => {
    const buckets = buildReliabilityDiagram([]);

    expect(buckets).toHaveLength(BUCKET_COUNT);
    expect(buckets[0]).toMatchObject({ rangeStart: 0, rangeEnd: 0.1, count: 0 });
    expect(buckets[9]).toMatchObject({ rangeStart: 0.9, rangeEnd: 1, count: 0 });
    expect(buckets.every((bucket) => bucket.predicted === null)).toBe(true);
  });

  it("pools class forecasts into the expected buckets with mean predicted and observed frequency", () => {
    const buckets = buildReliabilityDiagram(fixture);

    // loss class: p=0.1 -> bucket 1
    expect(buckets[1]).toMatchObject({ count: 4 });
    expect(buckets[1].predicted).toBeCloseTo(0.1, 10);
    expect(buckets[1].observed).toBeCloseTo(0.25, 10);

    // draw class: p=0.2 -> bucket 2
    expect(buckets[2]).toMatchObject({ count: 4 });
    expect(buckets[2].predicted).toBeCloseTo(0.2, 10);
    expect(buckets[2].observed).toBeCloseTo(0.25, 10);

    // win class: p=0.7 -> bucket 7
    expect(buckets[7]).toMatchObject({ count: 4 });
    expect(buckets[7].predicted).toBeCloseTo(0.7, 10);
    expect(buckets[7].observed).toBeCloseTo(0.5, 10);

    // every other bucket is empty
    const populated = buckets.filter((bucket) => bucket.count > 0).map((b) => b.bucket);
    expect(populated).toEqual([1, 2, 7]);
  });

  it("lands on the diagonal for a perfectly calibrated bucket", () => {
    // 10 forecasts at p=0.5 for the win class with exactly 5 wins.
    const perfect: ResolvedMatch[] = Array.from({ length: 10 }, (_, index) =>
      match(`p${index}`, 0.5, 0.25, 0.25, index < 5 ? "win" : "loss"),
    );
    const buckets = buildReliabilityDiagram(perfect);

    expect(buckets[5].predicted).toBeCloseTo(0.5, 10);
    expect(buckets[5].observed).toBeCloseTo(0.5, 10);
  });
});

describe("calibration report", () => {
  it("assembles sample size, forecast count, buckets and scores", () => {
    const report = buildCalibrationReport(fixture);

    expect(report.sampleSize).toBe(4);
    expect(report.forecastCount).toBe(12);
    expect(report.buckets).toHaveLength(BUCKET_COUNT);
    expect(report.brierScore).toBeCloseTo(0.69, 10);
    expect(report.runningBrier).toHaveLength(4);
  });
});
