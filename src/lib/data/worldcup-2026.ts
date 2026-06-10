import { worldCup2026Fixtures } from "../../../data/worldcup-2026/fixtures";
import { worldCup2026Groups } from "../../../data/worldcup-2026/groups";
import { roundOf32Paths } from "../../../data/worldcup-2026/knockout-paths";
import { worldCup2026Venues } from "../../../data/worldcup-2026/venues";

export const WORLD_CUP_2026_DATASET_MODE =
  "2026_TOURNAMENT_DATASET_MODE" as const;

export const WORLD_CUP_2026_DATASET_NOTICE =
  "2026 Tournament Dataset Mode: official-data-ready structure with a small manually curated seed. Placeholder rows are not official fixtures.";

export function getWorldCup2026Dataset() {
  return {
    datasetMode: WORLD_CUP_2026_DATASET_MODE,
    notice: WORLD_CUP_2026_DATASET_NOTICE,
    groups: worldCup2026Groups,
    fixtures: worldCup2026Fixtures,
    venues: worldCup2026Venues,
    roundOf32Paths,
  };
}
