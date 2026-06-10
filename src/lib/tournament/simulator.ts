import { DATASET_MODE, teams } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { predictMatch } from "@/lib/prediction/match";
import { round } from "@/lib/prediction/math";
import { createSeededRandom, samplePoisson, weightedChoice } from "@/lib/prediction/random";
import {
  applyQualificationStatus,
  buildStandingsForGroup,
  createGroupFixtures,
  rankThirdPlaceTeams,
} from "@/lib/tournament/rules";
import { resolveRoundOf32Paths } from "@/lib/worldcup-2026/knockout-path-resolver";
import {
  GROUP_CODES,
  type GroupCode,
  type KnockoutRound,
  type SimulatedMatch,
  type SingleTournamentSimulation,
  type StandingRow,
  type TeamRoundProbability,
  type TeamRating,
  type TeamQualificationProbability,
  type TournamentSimulationSummary,
} from "@/lib/types";

const MODEL_VERSION = "worldcup-oracle-baseline-v2";

type RoundCounter = Omit<TeamRoundProbability, "teamId"> & {
  topTwo: number;
  thirdPlace: number;
  bestThirdPlace: number;
};

interface SimulateOptions {
  iterations?: number;
  seed?: string;
  ratings?: Map<string, TeamRating>;
}

interface RoundResult {
  round: KnockoutRound;
  winners: string[];
  losers: string[];
}

function simulateScheduledMatch(
  id: string,
  stage: string,
  homeTeamId: string,
  awayTeamId: string,
  ratings: Map<string, TeamRating>,
  seed: string,
  forceWinner = false,
  group?: GroupCode,
): SimulatedMatch {
  const random = createSeededRandom(`${seed}:${id}:${homeTeamId}:${awayTeamId}`);
  const prediction = predictMatch(homeTeamId, awayTeamId, ratings);
  const homeGoals = samplePoisson(prediction.expectedGoals.teamA, random);
  const awayGoals = samplePoisson(prediction.expectedGoals.teamB, random);
  let winnerTeamId: string | undefined;
  let wentToPenalties = false;

  if (homeGoals > awayGoals) {
    winnerTeamId = homeTeamId;
  } else if (awayGoals > homeGoals) {
    winnerTeamId = awayTeamId;
  } else if (forceWinner) {
    wentToPenalties = true;
    const homePenaltyWeight = Math.max(0.05, prediction.probabilities.teamAWin);
    const awayPenaltyWeight = Math.max(0.05, prediction.probabilities.teamBWin);
    winnerTeamId = weightedChoice(
      [
        { teamId: homeTeamId, weight: homePenaltyWeight },
        { teamId: awayTeamId, weight: awayPenaltyWeight },
      ],
      (item) => item.weight,
      random,
    ).teamId;
  }

  return {
    id,
    stage,
    group,
    homeTeamId,
    awayTeamId,
    homeGoals,
    awayGoals,
    winnerTeamId,
    wentToPenalties,
  };
}

function simulateGroupStage(
  ratings: Map<string, TeamRating>,
  seed: string,
): {
  groupTables: Record<GroupCode, StandingRow[]>;
  bestThirdPlace: StandingRow[];
  eliminatedThirdPlace: StandingRow[];
  groupMatches: SimulatedMatch[];
} {
  const fixtures = createGroupFixtures();
  const groupMatches = fixtures.map((fixture) =>
    simulateScheduledMatch(
      fixture.id,
      fixture.stage,
      fixture.homeTeamId,
      fixture.awayTeamId,
      ratings,
      seed,
      false,
      fixture.group,
    ),
  );
  const unsafedTables = GROUP_CODES.reduce(
    (tables, groupCode) => {
      tables[groupCode] = buildStandingsForGroup(
        groupCode,
        groupMatches,
        ratings,
        `${seed}:${groupCode}`,
      );
      return tables;
    },
    {} as Record<GroupCode, StandingRow[]>,
  );
  const thirdPlaceRank = rankThirdPlaceTeams(unsafedTables, ratings, seed);
  const groupTables = applyQualificationStatus(unsafedTables, thirdPlaceRank);

  return {
    groupTables,
    bestThirdPlace: thirdPlaceRank.slice(0, 8).map((row) => ({
      ...row,
      status: "third-place bubble",
    })),
    eliminatedThirdPlace: thirdPlaceRank.slice(8).map((row) => ({
      ...row,
      status: "eliminated",
    })),
    groupMatches,
  };
}

function simulateKnockoutRound(
  name: KnockoutRound["name"],
  pairings: Array<[string, string]>,
  ratings: Map<string, TeamRating>,
  seed: string,
): RoundResult {
  const matches = pairings.map(([homeTeamId, awayTeamId], index) =>
    simulateScheduledMatch(
      `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`,
      name,
      homeTeamId,
      awayTeamId,
      ratings,
      seed,
      true,
    ),
  );

  return {
    round: { name, matches },
    winners: matches.map((match) => match.winnerTeamId ?? match.homeTeamId),
    losers: matches.map((match) =>
      match.winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId,
    ),
  };
}

function pairSequentially(teamIds: string[]): Array<[string, string]> {
  const pairings: Array<[string, string]> = [];

  for (let index = 0; index < teamIds.length; index += 2) {
    pairings.push([teamIds[index] ?? "", teamIds[index + 1] ?? ""]);
  }

  return pairings;
}

export function simulateSingleTournament(
  seed: string,
  ratings: Map<string, TeamRating> = buildTeamRatings(),
): SingleTournamentSimulation {
  const groupStage = simulateGroupStage(ratings, seed);
  const roundOf32Pairings = resolveRoundOf32Paths(
    groupStage.groupTables,
    groupStage.bestThirdPlace,
  ).map((path) => [path.homeTeamId, path.awayTeamId] as [string, string]);
  const roundOf32 = simulateKnockoutRound(
    "Round of 32",
    roundOf32Pairings,
    ratings,
    `${seed}:r32`,
  );
  const roundOf16 = simulateKnockoutRound(
    "Round of 16",
    pairSequentially(roundOf32.winners),
    ratings,
    `${seed}:r16`,
  );
  const quarterFinals = simulateKnockoutRound(
    "Quarter-finals",
    pairSequentially(roundOf16.winners),
    ratings,
    `${seed}:qf`,
  );
  const semiFinals = simulateKnockoutRound(
    "Semi-finals",
    pairSequentially(quarterFinals.winners),
    ratings,
    `${seed}:sf`,
  );
  const thirdPlace = simulateKnockoutRound(
    "Third-place",
    [[semiFinals.losers[0] ?? "", semiFinals.losers[1] ?? ""]],
    ratings,
    `${seed}:third`,
  );
  const final = simulateKnockoutRound(
    "Final",
    [[semiFinals.winners[0] ?? "", semiFinals.winners[1] ?? ""]],
    ratings,
    `${seed}:final`,
  );

  return {
    groupTables: groupStage.groupTables,
    bestThirdPlace: groupStage.bestThirdPlace,
    eliminatedThirdPlace: groupStage.eliminatedThirdPlace,
    bracket: [
      roundOf32.round,
      roundOf16.round,
      quarterFinals.round,
      semiFinals.round,
      thirdPlace.round,
      final.round,
    ],
    championTeamId: final.winners[0] ?? "",
    runnerUpTeamId: final.losers[0] ?? "",
    thirdPlaceTeamId: thirdPlace.winners[0] ?? "",
  };
}

function createCounter(): RoundCounter {
  return {
    topTwo: 0,
    thirdPlace: 0,
    bestThirdPlace: 0,
    roundOf32: 0,
    roundOf16: 0,
    quarterFinal: 0,
    semiFinal: 0,
    final: 0,
    champion: 0,
  };
}

function addTeamsFromRound(
  counters: Map<string, RoundCounter>,
  round: KnockoutRound,
  key: keyof RoundCounter,
): void {
  for (const match of round.matches) {
    counters.get(match.homeTeamId)![key] += 1;
    counters.get(match.awayTeamId)![key] += 1;
  }
}

function addGroupAdvancers(
  counters: Map<string, RoundCounter>,
  simulation: SingleTournamentSimulation,
): void {
  const advanced = new Set<string>();

  for (const groupCode of GROUP_CODES) {
    const topTwoRows = simulation.groupTables[groupCode].slice(0, 2);
    const thirdPlaceRow = simulation.groupTables[groupCode][2];

    for (const row of topTwoRows) {
      advanced.add(row.teamId);
      counters.get(row.teamId)!.topTwo += 1;
    }

    if (thirdPlaceRow) {
      counters.get(thirdPlaceRow.teamId)!.thirdPlace += 1;
    }
  }

  for (const row of simulation.bestThirdPlace) {
    advanced.add(row.teamId);
    counters.get(row.teamId)!.bestThirdPlace += 1;
  }

  for (const teamId of advanced) {
    counters.get(teamId)!.roundOf32 += 1;
  }
}

function finalKey(finalRound: KnockoutRound): string {
  const finalMatch = finalRound.matches[0];

  if (!finalMatch) {
    return "";
  }

  return [finalMatch.homeTeamId, finalMatch.awayTeamId].sort().join("|");
}

function buildSimulationAnalytics(
  probabilities: TeamRoundProbability[],
  ratings: Map<string, TeamRating>,
  single: SingleTournamentSimulation,
): TournamentSimulationSummary["analytics"] {
  const medianSeedRating = [...ratings.values()]
    .map((rating) => rating.rating)
    .sort((left, right) => left - right)[Math.floor(ratings.size / 2)] ?? 1700;
  const darkHorse =
    probabilities
      .filter((row) => (ratings.get(row.teamId)?.rating ?? 0) < medianSeedRating)
      .sort((left, right) => right.champion - left.champion)[0] ??
    probabilities[probabilities.length - 1]!;
  const upsetRisk =
    probabilities
      .map((row) => ({
        ...row,
        risk: Math.max(0, row.final - row.champion),
      }))
      .sort((left, right) => right.risk - left.risk)[0] ?? probabilities[0]!;
  const bestBubblePoints = single.bestThirdPlace[0]?.points ?? 0;
  const weakestBubblePoints =
    single.eliminatedThirdPlace[single.eliminatedThirdPlace.length - 1]?.points ?? 0;
  const thirdPlaceSpread = Math.max(0, bestBubblePoints - weakestBubblePoints);
  const topChampion = probabilities[0]?.champion ?? 0;

  return {
    darkHorse: {
      teamId: darkHorse.teamId,
      championProbability: darkHorse.champion,
      seedRating: Math.round(ratings.get(darkHorse.teamId)?.rating ?? 0),
    },
    upsetRisk: {
      teamId: upsetRisk.teamId,
      championProbability: upsetRisk.champion,
      finalProbability: upsetRisk.final,
    },
    groupChaos: {
      score: round(1 - Math.min(1, Math.max(0, thirdPlaceSpread / 10)), 4),
      note: "Higher score means the simulated third-place bubble is tighter.",
    },
    modelConfidence: {
      score: round(topChampion, 4),
      note: "Higher score means the tournament favorite separates more clearly from the field.",
    },
  };
}

export function runTournamentSimulation({
  iterations = 1000,
  seed = "worldcup-oracle",
  ratings = buildTeamRatings(),
}: SimulateOptions = {}): TournamentSimulationSummary {
  const boundedIterations = Math.max(1, Math.min(10000, Math.floor(iterations)));
  const counters = new Map(teams.map((team) => [team.id, createCounter()]));
  const finalPairCounts = new Map<string, number>();
  let firstSimulation: SingleTournamentSimulation | undefined;

  for (let index = 0; index < boundedIterations; index += 1) {
    const simulation = simulateSingleTournament(`${seed}:${index}`, ratings);

    if (!firstSimulation) {
      firstSimulation = simulation;
    }

    addGroupAdvancers(counters, simulation);

    for (const round of simulation.bracket) {
      if (round.name === "Round of 16") {
        addTeamsFromRound(counters, round, "roundOf16");
      }

      if (round.name === "Quarter-finals") {
        addTeamsFromRound(counters, round, "quarterFinal");
      }

      if (round.name === "Semi-finals") {
        addTeamsFromRound(counters, round, "semiFinal");
      }

      if (round.name === "Final") {
        addTeamsFromRound(counters, round, "final");
        const key = finalKey(round);
        finalPairCounts.set(key, (finalPairCounts.get(key) ?? 0) + 1);
      }
    }

    counters.get(simulation.championTeamId)!.champion += 1;
  }

  const probabilities = teams
    .map<TeamRoundProbability>((team) => {
      const counter = counters.get(team.id) ?? createCounter();

      return {
        teamId: team.id,
        roundOf32: round(counter.roundOf32 / boundedIterations, 4),
        roundOf16: round(counter.roundOf16 / boundedIterations, 4),
        quarterFinal: round(counter.quarterFinal / boundedIterations, 4),
        semiFinal: round(counter.semiFinal / boundedIterations, 4),
        final: round(counter.final / boundedIterations, 4),
        champion: round(counter.champion / boundedIterations, 4),
      };
    })
    .sort((left, right) => right.champion - left.champion);
  const qualificationProbabilities = teams
    .map<TeamQualificationProbability>((team) => {
      const counter = counters.get(team.id) ?? createCounter();

      return {
        teamId: team.id,
        topTwo: round(counter.topTwo / boundedIterations, 4),
        thirdPlace: round(counter.thirdPlace / boundedIterations, 4),
        bestThirdPlace: round(counter.bestThirdPlace / boundedIterations, 4),
        groupAdvance: round(counter.roundOf32 / boundedIterations, 4),
      };
    })
    .sort((left, right) => right.groupAdvance - left.groupAdvance);

  const [likelyFinalKey, likelyFinalCount = 0] =
    [...finalPairCounts.entries()].sort((left, right) => right[1] - left[1])[0] ??
    ["", 0];
  const [teamAId = "", teamBId = ""] = likelyFinalKey.split("|");
  const representativeSimulation =
    firstSimulation ?? simulateSingleTournament(seed, ratings);

  return {
    datasetMode: DATASET_MODE,
    iterations: boundedIterations,
    metadata: {
      simulationCount: boundedIterations,
      seed,
      datasetMode: DATASET_MODE,
      generatedAt: new Date().toISOString(),
      modelVersion: MODEL_VERSION,
    },
    teams,
    probabilities,
    qualificationProbabilities,
    single: representativeSimulation,
    mostLikelyFinal: {
      teamAId,
      teamBId,
      probability: round(likelyFinalCount / boundedIterations, 4),
    },
    analytics: buildSimulationAnalytics(probabilities, ratings, representativeSimulation),
  };
}

export function createTournamentMatches() {
  return {
    groupStage: createGroupFixtures(),
    totalMatches: 104,
    knockoutMatches: 32,
    roundOf32PathResolver: "data/worldcup-2026/knockout-paths.ts",
  };
}
