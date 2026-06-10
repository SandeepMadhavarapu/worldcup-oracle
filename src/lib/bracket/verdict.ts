// Pure verdict-tagging logic for a bracket's champion pick. Given the model's
// champion probability for the picked team, it returns a short, shareable
// verdict tag plus a tone for styling. No I/O — fully unit-testable.

export type VerdictTone = "chalk" | "balanced" | "bold" | "longshot";

export interface Verdict {
  tag: string;
  tone: VerdictTone;
}

/**
 * Champion-probability thresholds (as fractions in [0, 1]) that separate the
 * verdict tiers. A pick at or above a threshold falls into that tier.
 */
export const VERDICT_THRESHOLDS = {
  /** At/above this, the pick is the field's favorite. */
  chalk: 0.12,
  /** At/above this, a credible contender. */
  contender: 0.06,
  /** At/above this, a contrarian-but-plausible "bold" call. */
  bold: 0.025,
} as const;

/**
 * Format a champion probability as a compact percentage string. Positive
 * probabilities that round below 1% render as "<1%" rather than "0%".
 */
export function formatChampionOdds(probability: number): string {
  const pct = probability * 100;

  if (pct <= 0) {
    return "0%";
  }

  if (pct < 1) {
    return "<1%";
  }

  return `${Math.round(pct)}%`;
}

/**
 * Map a champion probability to a verdict tag. Favorites read as "Chalk pick";
 * contrarian picks surface their long odds (e.g. "Bold call — 4% champion
 * odds") to make the gamble legible.
 */
export function verdictForChampionProbability(probability: number): Verdict {
  if (probability >= VERDICT_THRESHOLDS.chalk) {
    return { tag: "Chalk pick", tone: "chalk" };
  }

  if (probability >= VERDICT_THRESHOLDS.contender) {
    return { tag: "Solid contender", tone: "balanced" };
  }

  const odds = formatChampionOdds(probability);

  if (probability >= VERDICT_THRESHOLDS.bold) {
    return { tag: `Bold call — ${odds} champion odds`, tone: "bold" };
  }

  return { tag: `Long shot — ${odds} champion odds`, tone: "longshot" };
}
