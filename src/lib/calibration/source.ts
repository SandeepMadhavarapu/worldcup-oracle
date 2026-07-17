// The real-vs-synthetic switch. Given the real graded results (from the live
// provider) and the synthetic illustration, pick EXACTLY ONE to grade — never a
// blend. The moment a single real match has resolved we show real accuracy;
// until then we show the clearly-labeled illustration. This pure function is the
// heart of "never mix the two silently", so it is unit-tested directly.

import type { ResolvedMatch } from "@/lib/calibration/types";

export type CalibrationSourceKind = "live" | "illustrative";

export interface CalibrationSource {
  kind: CalibrationSourceKind;
  /** True only when grading against real resolved results. */
  isLive: boolean;
  /** The matches the report is built from — a single source, never concatenated. */
  matches: ResolvedMatch[];
  /** Count of REAL resolved matches available (0 in illustrative mode). */
  resolvedCount: number;
  /** Unmistakable headline label for the page. */
  label: string;
  /** Longer honest explanation of what the numbers mean. */
  note: string;
}

export const ILLUSTRATIVE_LABEL = "Illustrative — no real matches resolved yet";

/**
 * Below this many resolved real matches, accuracy numbers are statistically
 * noise. We still switch to the real source (never blend), but the label and
 * note must say the sample is too small to support accuracy claims.
 */
export const SMALL_SAMPLE_THRESHOLD = 10;

export const ILLUSTRATIVE_NOTE =
  "No World Cup matches have resolved through the live feed yet, so this diagram is built from synthetic matches: each is forecast by the real engine, then its outcome is sampled from that same forecast with a fixed seed. It is calibrated by construction — an illustration of what good calibration looks like, not evidence of real-world accuracy. It will switch to real results automatically once matches finish.";

export function liveLabel(count: number): string {
  if (count < SMALL_SAMPLE_THRESHOLD) {
    return `Early real results (${count} resolved — sample too small for accuracy claims)`;
  }

  return `Live accuracy vs real results (${count} resolved)`;
}

export function liveNote(count: number): string {
  const matchWord = count === 1 ? "match" : "matches";
  const base = `Graded against ${count} real World Cup ${matchWord} resolved through the live feed. Each forecast is the engine's pre-match win/draw/loss probability; each outcome is the real final score.`;

  if (count < SMALL_SAMPLE_THRESHOLD) {
    return `${base} With fewer than ${SMALL_SAMPLE_THRESHOLD} resolved matches this is a progress view, not a statistically meaningful accuracy measurement.`;
  }

  return `${base} This is genuine accuracy, not a self-graded sample.`;
}

/**
 * Choose the calibration data source. Real results win whenever at least one
 * exists; otherwise fall back to the synthetic illustration. The returned
 * `matches` array is always exactly one of the two inputs.
 */
export function selectCalibrationSource(
  liveMatches: ResolvedMatch[],
  syntheticMatches: ResolvedMatch[],
): CalibrationSource {
  if (liveMatches.length > 0) {
    return {
      kind: "live",
      isLive: true,
      matches: liveMatches,
      resolvedCount: liveMatches.length,
      label: liveLabel(liveMatches.length),
      note: liveNote(liveMatches.length),
    };
  }

  return {
    kind: "illustrative",
    isLive: false,
    matches: syntheticMatches,
    resolvedCount: 0,
    label: ILLUSTRATIVE_LABEL,
    note: ILLUSTRATIVE_NOTE,
  };
}
