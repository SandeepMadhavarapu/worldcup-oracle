import { historicalResults, teams } from "@/lib/data";
import type { CompetitionType, HistoricalMatch, Team, TeamRating } from "@/lib/types";
import { clamp } from "@/lib/prediction/math";

const COMPETITION_WEIGHT: Record<CompetitionType, number> = {
  world_cup: 1.45,
  continental: 1.22,
  qualifier: 1,
  friendly: 0.72,
};

const TRAINING_CUTOFF = new Date("2026-06-01T00:00:00.000Z").getTime();
const YEAR_IN_MS = 365.25 * 24 * 60 * 60 * 1000;

function resultScore(goalsFor: number, goalsAgainst: number): number {
  if (goalsFor > goalsAgainst) {
    return 1;
  }

  if (goalsFor === goalsAgainst) {
    return 0.5;
  }

  return 0;
}

function expectedScore(ratingA: number, ratingB: number): number {
  // Standard Elo logistic curve: 400 rating points maps to roughly a 10x
  // expected-score advantage before football-specific weighting is applied.
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

function recencyWeight(date: string): number {
  const matchTime = new Date(`${date}T00:00:00.000Z`).getTime();
  const ageYears = Math.max(0, (TRAINING_CUTOFF - matchTime) / YEAR_IN_MS);

  return 0.55 + 0.45 * Math.exp(-ageYears / 3);
}

export function updateEloRatings(
  homeRating: number,
  awayRating: number,
  match: Pick<
    HistoricalMatch,
    "homeGoals" | "awayGoals" | "neutral" | "competition" | "date"
  >,
): { home: number; away: number; delta: number } {
  const homeAdvantage = match.neutral ? 0 : 42;
  const expectedHome = expectedScore(homeRating + homeAdvantage, awayRating);
  const actualHome = resultScore(match.homeGoals, match.awayGoals);
  const goalMargin = Math.min(4, Math.abs(match.homeGoals - match.awayGoals));
  const marginMultiplier = 1 + goalMargin * 0.12;
  // K-factor grows for more important competitions and shrinks for older rows.
  // This keeps the baseline explainable while making recent major matches matter.
  const kFactor =
    28 *
    COMPETITION_WEIGHT[match.competition] *
    recencyWeight(match.date) *
    marginMultiplier;
  const delta = kFactor * (actualHome - expectedHome);

  return {
    home: homeRating + delta,
    away: awayRating - delta,
    delta,
  };
}

function createInitialRating(team: Team): TeamRating {
  return {
    teamId: team.id,
    rating: team.eloSeed,
    attack: team.attack,
    defense: team.defense,
    form: team.form,
    matches: 0,
  };
}

export function buildTeamRatings(
  teamList: Team[] = teams,
  matches: HistoricalMatch[] = historicalResults,
): Map<string, TeamRating> {
  const ratings = new Map(teamList.map((team) => [team.id, createInitialRating(team)]));

  for (const match of matches) {
    const home = ratings.get(match.homeTeamId);
    const away = ratings.get(match.awayTeamId);

    if (!home || !away) {
      continue;
    }

    const updated = updateEloRatings(home.rating, away.rating, match);
    const homeGoalDelta = match.homeGoals - match.awayGoals;
    const awayGoalDelta = -homeGoalDelta;

    home.rating = updated.home;
    away.rating = updated.away;
    home.matches += 1;
    away.matches += 1;
    home.attack = clamp(home.attack + (match.homeGoals - 1.2) * 0.018, 0.72, 1.38);
    away.attack = clamp(away.attack + (match.awayGoals - 1.2) * 0.018, 0.72, 1.38);
    home.defense = clamp(home.defense + (1.15 - match.awayGoals) * 0.014, 0.72, 1.35);
    away.defense = clamp(away.defense + (1.15 - match.homeGoals) * 0.014, 0.72, 1.35);
    home.form = clamp(home.form + homeGoalDelta * 0.24 + updated.delta / 60, -6, 10);
    away.form = clamp(away.form + awayGoalDelta * 0.24 - updated.delta / 60, -6, 10);
  }

  return ratings;
}

export function getRatingOrSeed(
  ratings: Map<string, TeamRating>,
  team: Team,
): TeamRating {
  return ratings.get(team.id) ?? createInitialRating(team);
}
