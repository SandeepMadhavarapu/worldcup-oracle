import { getTeamOrThrow } from "@/lib/data";
import type {
  MatchPrediction,
  ScorelineProbability,
  Team,
  TeamRating,
} from "@/lib/types";
import {
  clamp,
  EXPECTED_GOALS_MAX,
  EXPECTED_GOALS_MIN,
  poissonProbability,
  round,
} from "@/lib/prediction/math";

const MAX_SCORELINE_GOALS = 6;

export function createScorelineDistribution(
  expectedTeamA: number,
  expectedTeamB: number,
): ScorelineProbability[] {
  const scorelines: ScorelineProbability[] = [];
  let total = 0;

  for (let homeGoals = 0; homeGoals <= MAX_SCORELINE_GOALS; homeGoals += 1) {
    for (let awayGoals = 0; awayGoals <= MAX_SCORELINE_GOALS; awayGoals += 1) {
      const probability =
        poissonProbability(expectedTeamA, homeGoals) *
        poissonProbability(expectedTeamB, awayGoals);
      total += probability;
      scorelines.push({ homeGoals, awayGoals, probability });
    }
  }

  return scorelines.map((scoreline) => ({
    ...scoreline,
    probability: scoreline.probability / total,
  }));
}

function summarizeOutcome(scorelines: ScorelineProbability[]) {
  return scorelines.reduce(
    (summary, scoreline) => {
      if (scoreline.homeGoals > scoreline.awayGoals) {
        summary.teamAWin += scoreline.probability;
      } else if (scoreline.homeGoals === scoreline.awayGoals) {
        summary.draw += scoreline.probability;
      } else {
        summary.teamBWin += scoreline.probability;
      }

      return summary;
    },
    { teamAWin: 0, draw: 0, teamBWin: 0 },
  );
}

/**
 * The minimal deterministic core shared by the full explainable prediction and
 * the Monte Carlo simulator: expected goals plus win/draw/loss mass from the
 * Poisson scoreline grid. Given a fixed ratings map this is a pure function of
 * the team pair, which is what makes per-run memoization in the simulator
 * sound.
 */
export interface MatchOdds {
  expectedGoals: { teamA: number; teamB: number };
  probabilities: { teamAWin: number; draw: number; teamBWin: number };
}

export function computeMatchOdds(
  teamAId: string,
  teamBId: string,
  ratings: Map<string, TeamRating>,
): MatchOdds {
  const teamA = getTeamOrThrow(teamAId);
  const teamB = getTeamOrThrow(teamBId);
  const ratingA = ratings.get(teamAId);
  const ratingB = ratings.get(teamBId);

  if (!ratingA || !ratingB) {
    throw new Error("Ratings are missing for one or both teams");
  }

  const expectedTeamA = expectedGoalsFor(teamA, teamB, ratingA, ratingB);
  const expectedTeamB = expectedGoalsFor(teamB, teamA, ratingB, ratingA);
  const probabilities = summarizeOutcome(
    createScorelineDistribution(expectedTeamA, expectedTeamB),
  );

  return {
    expectedGoals: { teamA: expectedTeamA, teamB: expectedTeamB },
    probabilities,
  };
}

function expectedGoalsFor(
  team: Team,
  opponent: Team,
  rating: TeamRating,
  opponentRating: TeamRating,
): number {
  // A compact log-link model: rating, form, attack, defense, and pedigree move
  // expected goals multiplicatively while clamps keep football scores realistic.
  const ratingTerm = (rating.rating - opponentRating.rating) / 760;
  const attackTerm = (rating.attack - 1) * 0.52;
  const defenseTerm = (opponentRating.defense - 1) * -0.42;
  const formTerm = (rating.form - opponentRating.form) / 46;
  const pedigreeTerm = (team.worldCupPedigree - opponent.worldCupPedigree) * 0.14;

  return clamp(
    1.22 * Math.exp(ratingTerm + attackTerm + defenseTerm + formTerm + pedigreeTerm),
    EXPECTED_GOALS_MIN,
    EXPECTED_GOALS_MAX,
  );
}

function createExplanation(
  teamA: Team,
  teamB: Team,
  ratingA: TeamRating,
  ratingB: TeamRating,
  prediction: Pick<
    MatchPrediction,
    | "probabilities"
    | "expectedGoals"
    | "ratingGap"
    | "attackDefenseSignal"
  >,
): string[] {
  const favorite =
    prediction.probabilities.teamAWin >= prediction.probabilities.teamBWin
      ? teamA
      : teamB;
  const underdog = favorite.id === teamA.id ? teamB : teamA;
  const ratingGap = Math.abs(prediction.ratingGap);
  const formGap = Math.abs(ratingA.form - ratingB.form);
  const attackSignal = Math.abs(prediction.attackDefenseSignal);

  return [
    `${favorite.name} is favored over ${underdog.name} because the model sees a ${Math.round(
      ratingGap,
    )}-point rating edge after sample historical updates.`,
    `Recent form contributes ${round(formGap, 1)} signal points, with competition-weighted matches carrying more influence than friendlies.`,
    `The score model expects ${round(
      prediction.expectedGoals.teamA,
      2,
    )}-${round(
      prediction.expectedGoals.teamB,
      2,
    )} goals from attack, defense, and neutral-venue assumptions.`,
    `Attack/defense separation is ${round(
      attackSignal,
      2,
    )}, so uncertainty remains visible rather than forcing a false certainty.`,
  ];
}

export function predictMatch(
  teamAId: string,
  teamBId: string,
  ratings: Map<string, TeamRating>,
): MatchPrediction {
  if (teamAId === teamBId) {
    throw new Error("Choose two different teams");
  }

  const teamA = getTeamOrThrow(teamAId);
  const teamB = getTeamOrThrow(teamBId);
  const ratingA = ratings.get(teamAId);
  const ratingB = ratings.get(teamBId);

  if (!ratingA || !ratingB) {
    throw new Error("Ratings are missing for one or both teams");
  }

  const expectedTeamA = expectedGoalsFor(teamA, teamB, ratingA, ratingB);
  const expectedTeamB = expectedGoalsFor(teamB, teamA, ratingB, ratingA);
  const scorelines = createScorelineDistribution(expectedTeamA, expectedTeamB);
  const probabilities = summarizeOutcome(scorelines);
  const sortedScorelines = [...scorelines]
    .sort((left, right) => right.probability - left.probability)
    .slice(0, 8)
    .map((scoreline) => ({
      ...scoreline,
      probability: round(scoreline.probability, 4),
    }));
  const ratingGap = round(ratingA.rating - ratingB.rating, 1);
  const attackDefenseSignal = round(
    ratingA.attack -
      ratingB.defense -
      (ratingB.attack - ratingA.defense) +
      (teamA.worldCupPedigree - teamB.worldCupPedigree) * 0.25,
    3,
  );
  const confidence = clamp(
    0.42 +
      Math.abs(probabilities.teamAWin - probabilities.teamBWin) * 0.5 +
      (1 - probabilities.draw) * 0.08,
    0.38,
    0.91,
  );
  const predictionBase = {
    teamAId,
    teamBId,
    favoredTeamId:
      probabilities.teamAWin >= probabilities.teamBWin ? teamAId : teamBId,
    probabilities: {
      teamAWin: round(probabilities.teamAWin, 4),
      draw: round(probabilities.draw, 4),
      teamBWin: round(probabilities.teamBWin, 4),
    },
    expectedGoals: {
      teamA: round(expectedTeamA, 3),
      teamB: round(expectedTeamB, 3),
    },
    topScorelines: sortedScorelines,
    confidence: round(confidence, 4),
    ratingGap,
    formSignal: round(ratingA.form - ratingB.form, 2),
    attackDefenseSignal,
    factors: [
      {
        label: "Rating gap",
        value: ratingGap,
        impact: ratingGap > 8 ? "teamA" : ratingGap < -8 ? "teamB" : "neutral",
        note: "Elo-style team strength after sample historical updates.",
      },
      {
        label: "Recent form",
        value: round(ratingA.form - ratingB.form, 2),
        impact:
          ratingA.form - ratingB.form > 0.5
            ? "teamA"
            : ratingA.form - ratingB.form < -0.5
              ? "teamB"
              : "neutral",
        note: "Compact form signal from recent weighted results.",
      },
      {
        label: "Attack-defense signal",
        value: attackDefenseSignal,
        impact:
          attackDefenseSignal > 0.03
            ? "teamA"
            : attackDefenseSignal < -0.03
              ? "teamB"
              : "neutral",
        note: "Relative attacking strength against opponent defensive resistance.",
      },
      {
        label: "Draw pressure",
        value: round(probabilities.draw, 4),
        impact: "neutral",
        note: "Poisson scoreline mass on equal-score outcomes.",
      },
    ] satisfies MatchPrediction["factors"],
  };

  return {
    ...predictionBase,
    explanation: createExplanation(teamA, teamB, ratingA, ratingB, predictionBase),
    uncertainty:
      "Educational estimate only. It uses a compact sample dataset, neutral venues, and simplified tactical inputs, so it should not be treated as official or betting guidance.",
    limitations: [
      "Sample data is intentionally small and not a complete international results database.",
      "Lineups, injuries, travel, rest, tactical matchups, and official fixtures are not modeled.",
      "The model is not calibrated against a full backtest and should not be interpreted as betting advice.",
    ],
  };
}
