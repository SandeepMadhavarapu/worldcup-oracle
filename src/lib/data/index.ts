import { GROUP_CODES, type GroupCode } from "@/lib/types";
import { historicalResults } from "@/lib/data/historical-results";
import {
  createApiMeta,
  getProviderMode,
  getProviderNotice,
} from "@/lib/data/provider-mode";
import {
  getWorldCup2026Dataset,
  WORLD_CUP_2026_DATASET_MODE,
  WORLD_CUP_2026_DATASET_NOTICE,
} from "@/lib/data/worldcup-2026";
import {
  DATASET_MODE,
  DATASET_NOTICE,
  getTeamName,
  teamById,
  teams,
} from "@/lib/data/teams";

export {
  DATASET_MODE,
  DATASET_NOTICE,
  getWorldCup2026Dataset,
  WORLD_CUP_2026_DATASET_MODE,
  WORLD_CUP_2026_DATASET_NOTICE,
  createApiMeta,
  getProviderMode,
  getProviderNotice,
  getTeamName,
  historicalResults,
  teamById,
  teams,
};

export function getTeamsByGroup(): Record<GroupCode, typeof teams> {
  return GROUP_CODES.reduce(
    (groups, groupCode) => {
      groups[groupCode] = teams.filter((team) => team.group === groupCode);
      return groups;
    },
    {} as Record<GroupCode, typeof teams>,
  );
}

export function getTeamOrThrow(teamId: string) {
  const team = teamById.get(teamId);

  if (!team) {
    throw new Error(`Unknown team id: ${teamId}`);
  }

  return team;
}
