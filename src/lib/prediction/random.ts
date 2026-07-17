import { EXPECTED_GOALS_MAX, EXPECTED_GOALS_MIN } from "@/lib/prediction/math";

export interface SeededRandom {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
}

function hashSeed(seed: string): number {
  let hash = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSeededRandom(seed: string): SeededRandom {
  let state = hashSeed(seed) || 1;

  const next = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min: number, max: number) =>
      Math.floor(next() * (max - min + 1)) + min,
    pick: <T>(items: readonly T[]) => {
      if (items.length === 0) {
        throw new Error("Cannot pick from an empty array");
      }

      return items[Math.floor(next() * items.length)] as T;
    },
  };
}

export function weightedChoice<T>(
  items: readonly T[],
  getWeight: (item: T) => number,
  random: SeededRandom,
): T {
  const total = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0);

  if (total <= 0) {
    return random.pick(items);
  }

  let threshold = random.next() * total;

  for (const item of items) {
    threshold -= Math.max(0, getWeight(item));

    if (threshold <= 0) {
      return item;
    }
  }

  return items[items.length - 1] as T;
}

export function samplePoisson(lambda: number, random: SeededRandom): number {
  const boundedLambda = Math.max(
    EXPECTED_GOALS_MIN,
    Math.min(EXPECTED_GOALS_MAX, lambda),
  );
  const limit = Math.exp(-boundedLambda);
  let count = 0;
  let product = 1;

  do {
    count += 1;
    product *= random.next();
  } while (product > limit);

  return Math.max(0, count - 1);
}

export function deterministicNoise(key: string, magnitude: number): number {
  const random = createSeededRandom(key);
  return (random.next() * 2 - 1) * magnitude;
}
