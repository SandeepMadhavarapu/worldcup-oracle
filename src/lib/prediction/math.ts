// Shared bounds for a single team's expected goals in one match. Used by BOTH
// the analytic scoreline model and the Monte Carlo sampler so the two can never
// disagree about what a plausible lambda is.
export const EXPECTED_GOALS_MIN = 0.22;
export const EXPECTED_GOALS_MAX = 3.65;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, digits = 4): number {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

export function toPercent(value: number): number {
  return round(value * 100, 1);
}

export function poissonProbability(lambda: number, goals: number): number {
  if (goals < 0) {
    return 0;
  }

  let factorial = 1;

  for (let index = 2; index <= goals; index += 1) {
    factorial *= index;
  }

  return (Math.exp(-lambda) * lambda ** goals) / factorial;
}
