// Turns real FINISHED World Cup matches from the live provider into graded
// ResolvedMatch records. This is the HONEST path: the forecast comes from the
// same prediction engine the app uses everywhere, and the `actual` outcome is
// the real final score — not a sample from the model's own distribution. So a
// reliability diagram built from these grades the model against reality.
//
// The pure mapping functions are unit-tested with hand-built fixtures; the async
// loader is graceful (never throws, returns [] when live data is unavailable).

import { getProviderMode } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { predictMatch } from "@/lib/prediction/match";
import { resolveTeamId } from "@/lib/calibration/team-resolver";
import { fetchFinishedWorldCupMatches } from "@/lib/live/football-data";
import type { LiveMatch } from "@/lib/live/types";
import type { MatchOutcome, ResolvedMatch } from "@/lib/calibration/types";
import type { TeamRating } from "@/lib/types";

/** Home-perspective outcome from a real final score. */
export function outcomeFromScore(homeScore: number, awayScore: number): MatchOutcome {
  if (homeScore > awayScore) {
    return "win";
  }

  if (homeScore === awayScore) {
    return "draw";
  }

  return "loss";
}

/**
 * Grade a single finished provider match against the model's forecast, or
 * return null when it cannot be graded honestly: not finished, missing a final
 * score, or a team we cannot map onto our internal squad. Returning null keeps
 * unmappable matches out of the diagram rather than guessing.
 */
export function liveMatchToResolvedMatch(
  match: LiveMatch,
  ratings: Map<string, TeamRating>,
): ResolvedMatch | null {
  if (match.status !== "finished") {
    return null;
  }

  if (match.homeScore === null || match.awayScore === null) {
    return null;
  }

  const homeTeamId = resolveTeamId({ name: match.homeName, code: match.homeCode });
  const awayTeamId = resolveTeamId({ name: match.awayName, code: match.awayCode });

  if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
    return null;
  }

  let prediction;
  try {
    prediction = predictMatch(homeTeamId, awayTeamId, ratings);
  } catch {
    return null;
  }

  return {
    id: `live-resolved-${match.id}`,
    homeTeamId,
    awayTeamId,
    predicted: {
      win: prediction.probabilities.teamAWin,
      draw: prediction.probabilities.draw,
      loss: prediction.probabilities.teamBWin,
    },
    actual: outcomeFromScore(match.homeScore, match.awayScore),
    kickoff: match.utcDate,
  };
}

/**
 * Map a batch of finished provider matches to graded ResolvedMatches, dropping
 * any that cannot be graded, in a deterministic order (oldest kickoff first,
 * then id) so the reliability diagram and running Brier stream are stable.
 */
export function buildResolvedMatchesFromLive(
  matches: LiveMatch[],
  ratings: Map<string, TeamRating> = buildTeamRatings(),
): ResolvedMatch[] {
  const dropped: string[] = [];
  const resolved: ResolvedMatch[] = [];

  for (const match of matches) {
    const graded = liveMatchToResolvedMatch(match, ratings);

    if (graded) {
      resolved.push(graded);
    } else if (match.status === "finished") {
      // A FINISHED match we could not grade (usually an unmapped team name) is
      // silent data loss for the calibration page — make it visible to
      // operators without breaking the honest-drop behavior.
      dropped.push(`${match.homeName} vs ${match.awayName} (${match.id})`);
    }
  }

  if (dropped.length > 0 && process.env.NODE_ENV !== "test") {
    console.warn(
      JSON.stringify({
        level: "warn",
        msg: "calibration_unresolved_finished_matches",
        count: dropped.length,
        matches: dropped.slice(0, 10),
      }),
    );
  }

  return resolved.sort((left, right) => {
    const byTime = Date.parse(left.kickoff) - Date.parse(right.kickoff);
    return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
  });
}

export interface LiveGradingResult {
  matches: ResolvedMatch[];
  /** Count of FINISHED provider matches, gradable or not. */
  finishedCount: number;
  /** Finished matches that could not be graded (teams outside the demo field). */
  skippedCount: number;
}

/**
 * Load real graded results from the live provider, with coverage counts so the
 * UI can say "graded X of Y finished" instead of silently hiding the drops.
 * Never throws: returns an empty result when no live provider is configured or
 * the provider errors, so the calibration page can fall back to the labeled
 * synthetic illustration.
 */
export async function loadLiveGradingResult(
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<LiveGradingResult> {
  if (getProviderMode() !== "LIVE_PROVIDER_MODE") {
    return { matches: [], finishedCount: 0, skippedCount: 0 };
  }

  try {
    const finished = await fetchFinishedWorldCupMatches({ fetchImpl: deps.fetchImpl });
    const finishedCount = finished.filter(
      (match) => match.status === "finished",
    ).length;
    const matches = buildResolvedMatchesFromLive(finished);

    return {
      matches,
      finishedCount,
      skippedCount: finishedCount - matches.length,
    };
  } catch {
    return { matches: [], finishedCount: 0, skippedCount: 0 };
  }
}

/** Back-compat wrapper: graded matches only. */
export async function loadLiveResolvedMatches(
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<ResolvedMatch[]> {
  return (await loadLiveGradingResult(deps)).matches;
}
