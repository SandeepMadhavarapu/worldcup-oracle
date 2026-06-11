export const INTRO_SESSION_KEY = "worldcup-oracle:intro-complete:v1";
export const INTRO_REPLAY_EVENT = "worldcup-oracle:intro-replay";

export const INTRO_DURATION_MS = 5200;
export const INTRO_REDUCED_MOTION_DURATION_MS = 1700;

export function isIntroEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_INTRO !== "false";
}
