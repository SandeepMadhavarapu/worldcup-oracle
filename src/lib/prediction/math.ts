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
