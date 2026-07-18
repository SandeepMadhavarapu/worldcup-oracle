// Pure calibration math. No I/O, no randomness, no framework imports — every
// function is a deterministic transform of its inputs so it can be unit-tested
// against hand-computed fixtures.

import type {
  CalibrationReport,
  ConfidenceBand,
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

const OUTCOME_ORDER: MatchOutcome[] = ["win", "draw", "loss"];

/** Probability floor so a single maximally-wrong forecast cannot emit Infinity. */
const LOG_LOSS_FLOOR = 1e-4;

function actualProbability(match: ResolvedMatch): number {
  const index = OUTCOME_ORDER.indexOf(match.actual);
  return probabilityTriple(match)[index] ?? 0;
}

function topPick(match: ResolvedMatch): MatchOutcome {
  const triple = probabilityTriple(match);
  let best = 0;

  for (let index = 1; index < triple.length; index += 1) {
    if (triple[index] > triple[best]) {
      best = index;
    }
  }

  return OUTCOME_ORDER[best];
}

/** Mean negative log-likelihood of the realized outcome, or null when empty. */
export function logLoss(matches: ResolvedMatch[]): number | null {
  if (matches.length === 0) {
    return null;
  }

  let total = 0;
  for (const match of matches) {
    total += -Math.log(Math.max(LOG_LOSS_FLOOR, actualProbability(match)));
  }

  return total / matches.length;
}

/** Fraction of matches whose top-probability pick occurred, or null. */
export function topPickAccuracy(matches: ResolvedMatch[]): number | null {
  if (matches.length === 0) {
    return null;
  }

  const correct = matches.filter(
    (match) => topPick(match) === match.actual,
  ).length;

  return correct / matches.length;
}

/**
 * Expected calibration error over the pooled reliability buckets:
 * count-weighted mean absolute gap between predicted and observed frequency.
 */
export function expectedCalibrationError(
  buckets: ReliabilityBucket[],
): number | null {
  const populated = buckets.filter(
    (bucket): bucket is ReliabilityBucket & { predicted: number; observed: number } =>
      bucket.count > 0 && bucket.predicted !== null && bucket.observed !== null,
  );
  const total = populated.reduce((sum, bucket) => sum + bucket.count, 0);

  if (total === 0) {
    return null;
  }

  return populated.reduce(
    (sum, bucket) =>
      sum + (bucket.count / total) * Math.abs(bucket.predicted - bucket.observed),
    0,
  );
}

// Confidence bands for top-pick accuracy. A three-class forecast's top pick is
// always ≥ 1/3, so the first band starts there.
const CONFIDENCE_BAND_EDGES: Array<[number, number]> = [
  [1 / 3, 0.45],
  [0.45, 0.55],
  [0.55, 0.65],
  [0.65, 1.0000001],
];

/** Top-pick accuracy grouped by how confident the forecast was. */
export function buildConfidenceBands(
  matches: ResolvedMatch[],
): ConfidenceBand[] {
  return CONFIDENCE_BAND_EDGES.map(([rangeStart, rangeEnd]) => {
    const inBand = matches.filter((match) => {
      const confidence = Math.max(...probabilityTriple(match));
      return confidence >= rangeStart && confidence < rangeEnd;
    });

    if (inBand.length === 0) {
      return {
        rangeStart,
        rangeEnd: Math.min(1, rangeEnd),
        count: 0,
        avgConfidence: null,
        accuracy: null,
      };
    }

    const avgConfidence =
      inBand.reduce(
        (sum, match) => sum + Math.max(...probabilityTriple(match)),
        0,
      ) / inBand.length;
    const correct = inBand.filter(
      (match) => topPick(match) === match.actual,
    ).length;

    return {
      rangeStart,
      rangeEnd: Math.min(1, rangeEnd),
      count: inBand.length,
      avgConfidence,
      accuracy: correct / inBand.length,
    };
  });
}

/**
 * Full calibration report: reliability diagram plus aggregate metrics (Brier,
 * log loss, top-pick accuracy, expected calibration error, confidence bands)
 * and the running Brier stream. Pure aggregation of the functions above.
 */
export function buildCalibrationReport(
  matches: ResolvedMatch[],
): CalibrationReport {
  const buckets = buildReliabilityDiagram(matches);

  return {
    sampleSize: matches.length,
    forecastCount: matches.length * 3,
    buckets,
    brierScore: brierScore(matches),
    logLoss: logLoss(matches),
    accuracy: topPickAccuracy(matches),
    calibrationError: expectedCalibrationError(buckets),
    confidenceBands: buildConfidenceBands(matches),
    runningBrier: runningBrierScore(matches),
  };
}
