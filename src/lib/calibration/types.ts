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

export interface CalibrationReport {
  /** Number of resolved matches graded. */
  sampleSize: number;
  /** Number of pooled class forecasts (3 per match: win, draw, loss). */
  forecastCount: number;
  buckets: ReliabilityBucket[];
  /** Mean multi-class Brier score, or `null` when there are no matches. */
  brierScore: number | null;
  /** Cumulative Brier score after each match, in input order. */
  runningBrier: RunningBrierPoint[];
}
