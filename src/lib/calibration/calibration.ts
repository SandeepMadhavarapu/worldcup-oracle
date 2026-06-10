// Pure calibration math. No I/O, no randomness, no framework imports — every
// function is a deterministic transform of its inputs so it can be unit-tested
// against hand-computed fixtures.

import type {
  CalibrationReport,
  MatchOutcome,
  ReliabilityBucket,
  ResolvedMatch,
  RunningBrierPoint,
} from "@/lib/calibration/types";

export const BUCKET_COUNT = 10;

/**
 * One-hot outcome vector ordered as [win, draw, loss] to match
 * `OutcomeProbabilities`.
 */
export function outcomeVector(outcome: MatchOutcome): [number, number, number] {
  if (outcome === "win") {
    return [1, 0, 0];
  }

  if (outcome === "draw") {
    return [0, 1, 0];
  }

  return [0, 0, 1];
}

/**
 * Map a probability in [0, 1] to a bucket index in [0, BUCKET_COUNT - 1].
 * The top edge (1.0) folds into the final bucket so [0.9, 1.0] is inclusive.
 */
export function bucketIndex(probability: number): number {
  if (!Number.isFinite(probability)) {
    throw new Error(`Probability must be a finite number, received ${probability}`);
  }

  const clamped = Math.min(1, Math.max(0, probability));
  return Math.min(BUCKET_COUNT - 1, Math.floor(clamped * BUCKET_COUNT));
}

function probabilityTriple(match: ResolvedMatch): [number, number, number] {
  return [match.predicted.win, match.predicted.draw, match.predicted.loss];
}

/**
 * Multi-class Brier score for a single match: the squared error between the
 * forecast vector and the realized one-hot outcome, summed over win/draw/loss.
 * Ranges from 0 (perfect) to 2 (maximally wrong).
 */
export function matchBrier(match: ResolvedMatch): number {
  const predicted = probabilityTriple(match);
  const observed = outcomeVector(match.actual);

  let sum = 0;
  for (let index = 0; index < predicted.length; index += 1) {
    sum += (predicted[index] - observed[index]) ** 2;
  }

  return sum;
}

/**
 * Mean multi-class Brier score over all matches, or `null` for an empty set.
 */
export function brierScore(matches: ResolvedMatch[]): number | null {
  if (matches.length === 0) {
    return null;
  }

  let total = 0;
  for (const match of matches) {
    total += matchBrier(match);
  }

  return total / matches.length;
}

/**
 * Running (cumulative) Brier score after each match, in input order. This is
 * the "self-grading" stream: it shows how the average score settles as more
 * resolved matches arrive.
 */
export function runningBrierScore(matches: ResolvedMatch[]): RunningBrierPoint[] {
  let total = 0;

  return matches.map((match, index) => {
    total += matchBrier(match);
    return {
      index: index + 1,
      matchId: match.id,
      brier: total / (index + 1),
    };
  });
}

/**
 * Reliability diagram with `BUCKET_COUNT` fixed-width buckets. Each match
 * contributes three pooled forecasts (win, draw, loss), each routed to a bucket
 * by its predicted probability. Per bucket we report the mean predicted
 * probability, the observed frequency of those forecasts coming true, and the
 * sample count. A perfectly calibrated model has predicted ≈ observed in every
 * populated bucket (points landing on the diagonal).
 */
export function buildReliabilityDiagram(
  matches: ResolvedMatch[],
): ReliabilityBucket[] {
  const accumulator = Array.from({ length: BUCKET_COUNT }, () => ({
    predicted: 0,
    observed: 0,
    count: 0,
  }));

  for (const match of matches) {
    const predicted = probabilityTriple(match);
    const observed = outcomeVector(match.actual);

    for (let classIndex = 0; classIndex < predicted.length; classIndex += 1) {
      const probability = predicted[classIndex];
      const bucket = accumulator[bucketIndex(probability)];
      bucket.predicted += probability;
      bucket.observed += observed[classIndex];
      bucket.count += 1;
    }
  }

  return accumulator.map((bucket, index) => ({
    bucket: index,
    rangeStart: index / BUCKET_COUNT,
    rangeEnd: (index + 1) / BUCKET_COUNT,
    count: bucket.count,
    predicted: bucket.count === 0 ? null : bucket.predicted / bucket.count,
    observed: bucket.count === 0 ? null : bucket.observed / bucket.count,
  }));
}

/**
 * Full calibration report: reliability diagram plus aggregate and running
 * Brier scores. Pure aggregation of the functions above.
 */
export function buildCalibrationReport(
  matches: ResolvedMatch[],
): CalibrationReport {
  return {
    sampleSize: matches.length,
    forecastCount: matches.length * 3,
    buckets: buildReliabilityDiagram(matches),
    brierScore: brierScore(matches),
    runningBrier: runningBrierScore(matches),
  };
}
