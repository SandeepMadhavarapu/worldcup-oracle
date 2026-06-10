export type WorldCup2026FixtureStatus = "scheduled" | "completed" | "simulated";

export interface WorldCup2026Fixture {
  matchNumber: number;
  stage: "Group Stage" | "Round of 32" | "Round of 16" | "Quarter-finals" | "Semi-finals" | "Third-place" | "Final";
  group?: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  hostCity: string;
  kickoffTimeLocal?: string;
  status: WorldCup2026FixtureStatus;
  sourceLabel: string;
  notes?: string;
}

export const worldCup2026Fixtures: WorldCup2026Fixture[] = [
  {
    matchNumber: 1,
    stage: "Group Stage",
    group: "A",
    homeTeam: "mexico",
    awayTeam: "south-africa",
    venue: "Mexico City Stadium",
    hostCity: "Mexico City",
    kickoffTimeLocal: "2026-06-11T19:00:00-06:00",
    status: "scheduled",
    sourceLabel: "manual seed from FIFA public scores/fixtures page",
    notes:
      "Seed fixture included to prove the data model. Complete official fixtures should be manually curated before production claims.",
  },
  {
    matchNumber: 104,
    stage: "Final",
    homeTeam: "winner-match-101",
    awayTeam: "winner-match-102",
    venue: "New York New Jersey Stadium",
    hostCity: "East Rutherford",
    kickoffTimeLocal: "2026-07-19T19:00:00-04:00",
    status: "scheduled",
    sourceLabel: "manual seed from FIFA public scores/fixtures page",
    notes:
      "Final participant slots are bracket placeholders, not teams. No result is implied.",
  },
];
