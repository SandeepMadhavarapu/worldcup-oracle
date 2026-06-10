export type KnockoutEntrantKind =
  | "group-winner"
  | "group-runner-up"
  | "third-place-rank"
  | "match-winner";

export interface KnockoutEntrant {
  kind: KnockoutEntrantKind;
  group?: string;
  rank?: number;
  matchNumber?: number;
}

export interface RoundOf32Path {
  slotId: string;
  matchNumber: number;
  home: KnockoutEntrant;
  away: KnockoutEntrant;
  sourceLabel: string;
  approximationNote?: string;
}

export const roundOf32Paths: RoundOf32Path[] = [
  ["R32-1", 73, { kind: "group-winner", group: "A" }, { kind: "third-place-rank", rank: 8 }],
  ["R32-2", 74, { kind: "group-winner", group: "B" }, { kind: "third-place-rank", rank: 7 }],
  ["R32-3", 75, { kind: "group-winner", group: "C" }, { kind: "third-place-rank", rank: 6 }],
  ["R32-4", 76, { kind: "group-winner", group: "D" }, { kind: "third-place-rank", rank: 5 }],
  ["R32-5", 77, { kind: "group-winner", group: "E" }, { kind: "third-place-rank", rank: 4 }],
  ["R32-6", 78, { kind: "group-winner", group: "F" }, { kind: "third-place-rank", rank: 3 }],
  ["R32-7", 79, { kind: "group-winner", group: "G" }, { kind: "third-place-rank", rank: 2 }],
  ["R32-8", 80, { kind: "group-winner", group: "H" }, { kind: "third-place-rank", rank: 1 }],
  ["R32-9", 81, { kind: "group-winner", group: "I" }, { kind: "group-runner-up", group: "L" }],
  ["R32-10", 82, { kind: "group-winner", group: "J" }, { kind: "group-runner-up", group: "K" }],
  ["R32-11", 83, { kind: "group-winner", group: "K" }, { kind: "group-runner-up", group: "J" }],
  ["R32-12", 84, { kind: "group-winner", group: "L" }, { kind: "group-runner-up", group: "I" }],
  ["R32-13", 85, { kind: "group-runner-up", group: "A" }, { kind: "group-runner-up", group: "H" }],
  ["R32-14", 86, { kind: "group-runner-up", group: "B" }, { kind: "group-runner-up", group: "G" }],
  ["R32-15", 87, { kind: "group-runner-up", group: "C" }, { kind: "group-runner-up", group: "F" }],
  ["R32-16", 88, { kind: "group-runner-up", group: "D" }, { kind: "group-runner-up", group: "E" }],
].map(([slotId, matchNumber, home, away]) => ({
  slotId: slotId as string,
  matchNumber: matchNumber as number,
  home: home as KnockoutEntrant,
  away: away as KnockoutEntrant,
  sourceLabel: "data-driven MVP resolver",
  approximationNote:
    "Third-place placement uses deterministic rank fallback until exact official third-place matchup table is manually curated.",
}));
