import type { HistoricalMatch, TeamRating } from "@/lib/types";
import { predictMatch } from "@/lib/prediction/match";

export interface BacktestSummary {
  evaluatedMatches: number;
  logLoss: number | null;
  brierScore: number | null;
  note: string;
}

function actualVector(match: HistoricalMatch): [number, number, number] {
  if (match.homeGoals > match.awayGoals) {
    return [1, 0, 0];
  }

  if (match.homeGoals === match.awayGoals) {
    return [0, 1, 0];
  }

  return [0, 0, 1];
}

export function runBacktestScaffold(
  matches: HistoricalMatch[],
  ratings: Map<string, TeamRating>,
): BacktestSummary {
  const evaluated = matches.filter(
    (match) => ratings.has(match.homeTeamId) && ratings.has(match.awayTeamId),
  );

  if (evaluated.length === 0) {
    return {
      evaluatedMatches: 0,
      logLoss: null,
      brierScore: null,
      note: "Backtesting scaffold only: no evaluable rows were available.",
    };
  }

  let logLoss = 0;
  let brierScore = 0;

  for (const match of evaluated) {
    const prediction = predictMatch(match.homeTeamId, match.awayTeamId, ratings);
    const predicted = [
      prediction.probabilities.teamAWin,
      prediction.probabilities.draw,
      prediction.probabilities.teamBWin,
    ] as const;
    const actual = actualVector(match);

    for (let index = 0; index < predicted.length; index += 1) {
      brierScore += (predicted[index] - actual[index]) ** 2;
    }

    const actualIndex = actual.findIndex((value) => value === 1);
    logLoss += -Math.log(Math.max(0.0001, predicted[actualIndex] ?? 0.0001));
  }

  return {
    evaluatedMatches: evaluated.length,
    logLoss: logLoss / evaluated.length,
    brierScore: brierScore / evaluated.length,
    note: "Scaffold metric over the same compact sample data used to seed ratings. This is not an out-of-sample accuracy claim.",
  };
}
