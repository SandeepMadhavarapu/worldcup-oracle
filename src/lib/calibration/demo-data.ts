// Deterministic synthetic resolved matches for Demo Mode.
//
// HONESTY NOTE: these are NOT real results. Each match is forecast by the real
// prediction engine, then its "actual" outcome is sampled from that same
// forecast distribution using a fixed seed. The set is therefore calibrated by
// construction (predicted ≈ observed up to sampling noise) and exists only so
// the /calibration page renders meaningfully offline. It is illustrative of
// what good calibration looks like, not evidence of real-world accuracy.

import { teams } from "@/lib/data";
import { predictMatch } from "@/lib/prediction/match";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { createSeededRandom, type SeededRandom } from "@/lib/prediction/random";
import type {
  MatchOutcome,
  OutcomeProbabilities,
  ResolvedMatch,
} from "@/lib/calibration/types";

const DEMO_SEED = "calibration-demo-v1";
const DEMO_MATCH_COUNT = 90;
// Fixed reference date so generated kickoff dates are deterministic.
const BASE_DATE = Date.UTC(2026, 0, 1);

function sampleOutcome(
  probabilities: OutcomeProbabilities,
  random: SeededRandom,
): MatchOutcome {
  const roll = random.next();

  if (roll < probabilities.win) {
    return "win";
  }

  if (roll < probabilities.win + probabilities.draw) {
    return "draw";
  }

  return "loss";
}

function buildDemoResolvedMatches(): ResolvedMatch[] {
  const ratings = buildTeamRatings();
  const random = createSeededRandom(DEMO_SEED);
  const ids = teams.map((team) => team.id);
  const matches: ResolvedMatch[] = [];

  // Deterministically pair teams across rotating offsets so the sample spans a
  // wide range of forecast confidences (mismatches and toss-ups alike).
  let step = 0;
  let offset = 1;

  while (matches.length < DEMO_MATCH_COUNT && offset < ids.length) {
    const homeId = ids[step % ids.length];
    const awayId = ids[(step + offset) % ids.length];

    if (homeId !== awayId) {
      const prediction = predictMatch(homeId, awayId, ratings);
      const predicted: OutcomeProbabilities = {
        win: prediction.probabilities.teamAWin,
        draw: prediction.probabilities.draw,
        loss: prediction.probabilities.teamBWin,
      };
      const index = matches.length;

      matches.push({
        id: `demo-resolved-${String(index + 1).padStart(3, "0")}`,
        homeTeamId: homeId,
        awayTeamId: awayId,
        predicted,
        actual: sampleOutcome(predicted, random),
        kickoff: new Date(BASE_DATE + index * 86_400_000).toISOString(),
      });
    }

    step += 1;

    if (step % ids.length === 0) {
      offset += 1;
    }
  }

  return matches;
}

let cached: ResolvedMatch[] | null = null;

/**
 * Returns the deterministic synthetic resolved-match set, computed once and
 * cached. Identical on every call and across processes (fixed seed + inputs).
 */
export function getDemoResolvedMatches(): ResolvedMatch[] {
  if (!cached) {
    cached = buildDemoResolvedMatches();
  }

  return cached;
}
