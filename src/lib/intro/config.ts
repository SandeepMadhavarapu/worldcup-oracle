export const INTRO_SESSION_KEY = "worldcup-oracle:intro-complete:v1";
export const INTRO_REPLAY_EVENT = "worldcup-oracle:intro-replay";

// Content duration before auto-dismiss fires; exit animation adds ~0.7 s.
export const INTRO_DURATION_MS = 10000;
export const INTRO_REDUCED_MOTION_DURATION_MS = 1200;

/**
 * Whether the intro is AVAILABLE (via the nav replay button). It never
 * auto-plays on page load regardless of this flag; set to "false" to remove
 * the replay button entirely.
 */
export function isIntroEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_INTRO !== "false";
}
