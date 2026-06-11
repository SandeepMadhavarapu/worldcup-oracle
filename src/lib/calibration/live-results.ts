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
  return matches
    .map((match) => liveMatchToResolvedMatch(match, ratings))
    .filter((match): match is ResolvedMatch => match !== null)
    .sort((left, right) => {
      const byTime = Date.parse(left.kickoff) - Date.parse(right.kickoff);
      return byTime !== 0 ? byTime : left.id.localeCompare(right.id);
    });
}

/**
 * Load real graded results from the live provider. Never throws: returns [] when
 * no live provider is configured or the provider errors, so the calibration page
 * can fall back to the labeled synthetic illustration. `[]` here is a true "no
 * real matches resolved yet" signal, not an error to surface.
 */
export async function loadLiveResolvedMatches(
  deps: { fetchImpl?: typeof fetch } = {},
): Promise<ResolvedMatch[]> {
  if (getProviderMode() !== "LIVE_PROVIDER_MODE") {
    return [];
  }

  try {
    const finished = await fetchFinishedWorldCupMatches({ fetchImpl: deps.fetchImpl });
    return buildResolvedMatchesFromLive(finished);
  } catch {
    return [];
  }
}
