// Domain types for the self-grading calibration system. A "resolved match" is
// a match the model already forecast and whose real outcome is now known, so we
// can grade the forecast after the fact.

export type MatchOutcome = "win" | "draw" | "loss";

/**
 * Win / draw / loss probabilities from the home (team A) perspective. They are
 * expected to be non-negative; they do not strictly need to sum to 1 for the
 * math to be well-defined, but a well-formed forecast will.
 */
export interface OutcomeProbabilities {
  win: number;
  draw: number;
  loss: number;
}

export interface ResolvedMatch {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  predicted: OutcomeProbabilities;
  actual: MatchOutcome;
  /** Deterministic ISO date string, for display only. */
  kickoff: string;
}

/**
 * One bucket of a reliability diagram. Forecast probabilities are pooled across
 * the win/draw/loss classes (one-vs-all) and grouped into fixed-width buckets.
 * `predicted` is the mean forecast probability in the bucket (x-axis) and
 * `observed` is the fraction of those forecasts that actually occurred
 * (y-axis). Both are `null` when the bucket has no forecasts.
 */
export interface ReliabilityBucket {
  bucket: number;
  rangeStart: number;
  rangeEnd: number;
  count: number;
  predicted: number | null;
  observed: number | null;
}

export interface RunningBrierPoint {
  index: number;
  matchId: string;
  brier: number;
}

/**
 * Accuracy of the model's top pick within one band of forecast confidence
 * (confidence = the highest of the three class probabilities). The critical
 * calibration question in table form: when the model is ~65% sure, is it right
 * ~65% of the time?
 */
export interface ConfidenceBand {
  /** Inclusive lower bound of the top-pick probability for this band. */
  rangeStart: number;
  /** Exclusive upper bound (inclusive for the last band). */
  rangeEnd: number;
  count: number;
  /** Mean top-pick probability in the band, or null when empty. */
  avgConfidence: number | null;
  /** Fraction of matches where the top pick was the actual outcome. */
  accuracy: number | null;
}

export interface CalibrationReport {
  /** Number of resolved matches graded. */
  sampleSize: number;
  /** Number of pooled class forecasts (3 per match: win, draw, loss). */
  forecastCount: number;
  buckets: ReliabilityBucket[];
  /** Mean multi-class Brier score, or `null` when there are no matches. */
  brierScore: number | null;
  /** Mean negative log-likelihood of the actual outcome, or `null`. */
  logLoss: number | null;
  /** Fraction of matches where the model's top pick occurred, or `null`. */
  accuracy: number | null;
  /**
   * Expected calibration error: count-weighted mean |predicted − observed|
   * over the populated reliability buckets. 0 is perfectly calibrated.
   */
  calibrationError: number | null;
  /** Top-pick accuracy broken down by forecast confidence band. */
  confidenceBands: ConfidenceBand[];
  /** Cumulative Brier score after each match, in input order. */
  runningBrier: RunningBrierPoint[];
}
