import { afterEach, describe, expect, it, vi } from "vitest";

import {
  INTRO_DURATION_MS,
  INTRO_REDUCED_MOTION_DURATION_MS,
  isIntroEnabled,
} from "@/lib/intro/config";
import { hasIntroCompleted, markIntroCompleted } from "@/lib/intro/storage";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("intro gate utilities", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("stores completion in session-like storage", () => {
    const storage = new MemoryStorage();

    expect(hasIntroCompleted(storage)).toBe(false);

    markIntroCompleted(storage);

    expect(hasIntroCompleted(storage)).toBe(true);
  });

  it("can be disabled through the public environment flag", () => {
    expect(isIntroEnabled()).toBe(true);

    vi.stubEnv("NEXT_PUBLIC_ENABLE_INTRO", "false");

    expect(isIntroEnabled()).toBe(false);
  });

  it("uses the cinematic intro pacing with a reduced-motion shortcut", () => {
    expect(INTRO_DURATION_MS).toBe(10000);
    expect(INTRO_REDUCED_MOTION_DURATION_MS).toBeLessThan(INTRO_DURATION_MS);
  });
});
