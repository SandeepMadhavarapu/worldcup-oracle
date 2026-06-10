export type TournamentGroupCode =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type TeamSlotStatus =
  | "manual-curated"
  | "official-data-ready-placeholder";

export interface WorldCup2026GroupTeamSlot {
  slot: `${TournamentGroupCode}${1 | 2 | 3 | 4}`;
  teamSlug: string;
  teamName: string;
  status: TeamSlotStatus;
}

export interface WorldCup2026Group {
  group: TournamentGroupCode;
  sourceLabel: string;
  notes: string;
  teams: WorldCup2026GroupTeamSlot[];
}

function placeholder(group: TournamentGroupCode, seed: 1 | 2 | 3 | 4) {
  return {
    slot: `${group}${seed}` as const,
    teamSlug: `group-${group.toLowerCase()}-seed-${seed}`,
    teamName: `Group ${group} seed ${seed}`,
    status: "official-data-ready-placeholder" as const,
  };
}

export const worldCup2026Groups: WorldCup2026Group[] = [
  {
    group: "A",
    sourceLabel: "manual seed from FIFA public fixture listing",
    notes:
      "Only the opener participants are seeded here. Complete group curation should be finished manually from verified sources before production use.",
    teams: [
      {
        slot: "A1",
        teamSlug: "mexico",
        teamName: "Mexico",
        status: "manual-curated",
      },
      {
        slot: "A2",
        teamSlug: "south-africa",
        teamName: "South Africa",
        status: "manual-curated",
      },
      placeholder("A", 3),
      placeholder("A", 4),
    ],
  },
  ...(["B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const).map(
    (group) => ({
      group,
      sourceLabel: "official-data-ready placeholder",
      notes:
        "Group slots are intentionally placeholders until manually curated from official fixtures.",
      teams: [placeholder(group, 1), placeholder(group, 2), placeholder(group, 3), placeholder(group, 4)],
    }),
  ),
];
