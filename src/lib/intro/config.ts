export const INTRO_SESSION_KEY = "worldcup-oracle:intro-complete:v1";
export const INTRO_REPLAY_EVENT = "worldcup-oracle:intro-replay";

// Content duration before auto-dismiss fires; exit animation adds ~0.7 s.
export const INTRO_DURATION_MS = 10000;
export const INTRO_REDUCED_MOTION_DURATION_MS = 1200;

export function isIntroEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_INTRO !== "false";
}
