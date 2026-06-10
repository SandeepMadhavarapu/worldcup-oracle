import {
  DATASET_MODE,
  getProviderMode,
  getProviderNotice,
  getTeamsByGroup,
} from "@/lib/data";
import { runTournamentSimulation } from "@/lib/tournament/simulator";
import { jsonOk } from "@/lib/api/http";

export async function GET() {
  const projection = runTournamentSimulation({
    iterations: 1,
    seed: "api-groups-projection",
  });

  return jsonOk({
    datasetMode: DATASET_MODE,
    providerMode: getProviderMode(),
    notice: getProviderNotice(),
    groups: getTeamsByGroup(),
    projectedTables: projection.single.groupTables,
    bestThirdPlace: projection.single.bestThirdPlace,
  });
}
