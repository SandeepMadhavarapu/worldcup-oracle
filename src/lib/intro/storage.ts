import { INTRO_SESSION_KEY } from "@/lib/intro/config";

function readStorage(storage?: Storage): Storage | null {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

export function hasIntroCompleted(storage?: Storage): boolean {
  try {
    return readStorage(storage)?.getItem(INTRO_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export function markIntroCompleted(storage?: Storage): void {
  try {
    readStorage(storage)?.setItem(INTRO_SESSION_KEY, "true");
  } catch {
    // Storage can be unavailable in privacy modes. The intro remains skippable.
  }
}
