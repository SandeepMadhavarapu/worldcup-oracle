// Reads the cached baseline simulation and shapes one team's upset-path report:
// championship probability, final-reaching rate, and the modal title run with
// opponents resolved to display names.

import { getBaselineSimulation } from "@/lib/tournament/baseline";
import { teamById } from "@/lib/data";
import type { KnockoutRound, TitleRunStep } from "@/lib/types";

const ROUND_LABELS: Record<KnockoutRound["name"], string> = {
  "Round of 32": "R32",
  "Round of 16": "R16",
  "Quarter-finals": "QF",
  "Semi-finals": "SF",
  "Third-place": "3rd-place",
  Final: "the final",
};

export interface TeamPathStep {
  round: KnockoutRound["name"];
  roundLabel: string;
  opponentTeamId: string;
  opponentName: string;
  opponentCode: string;
}

export interface TeamPathReport {
  teamId: string;
  teamName: string;
  iterations: number;
  championProbability: number;
  finalProbability: number;
  /** Simulations this team won the title (the modal path's sample base). */
  titleCount: number;
  /** Simulations whose title run followed the exact modal opponent sequence. */
  modalCount: number;
  /** Share of this team's title runs that followed the modal path. */
  modalShare: number;
  hasTitleRun: boolean;
  steps: TeamPathStep[];
}

function resolveStep(step: TitleRunStep): TeamPathStep {
  const opponent = teamById.get(step.opponentTeamId);

  return {
    round: step.round,
    roundLabel: ROUND_LABELS[step.round] ?? step.round,
    opponentTeamId: step.opponentTeamId,
    opponentName: opponent?.name ?? step.opponentTeamId,
    opponentCode:
      opponent?.code ?? step.opponentTeamId.slice(0, 3).toUpperCase(),
  };
}

export function getTeamPathReport(teamId: string): TeamPathReport {
  const simulation = getBaselineSimulation();
  const probability = simulation.probabilities.find(
    (row) => row.teamId === teamId,
  );
  const titlePath = simulation.titlePaths?.find((row) => row.teamId === teamId);
  const team = teamById.get(teamId);

  return {
    teamId,
    teamName: team?.name ?? teamId,
    iterations: simulation.iterations,
    championProbability: probability?.champion ?? 0,
    finalProbability: probability?.final ?? 0,
    titleCount: titlePath?.titleCount ?? 0,
    modalCount: titlePath?.modalCount ?? 0,
    modalShare: titlePath?.modalShare ?? 0,
    hasTitleRun: Boolean(titlePath && titlePath.modalPath.length > 0),
    steps: titlePath ? titlePath.modalPath.map(resolveStep) : [],
  };
}
