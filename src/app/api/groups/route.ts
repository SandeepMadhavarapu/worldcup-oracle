import {
  DATASET_MODE,
  getProviderMode,
  getProviderNotice,
  getTeamsByGroup,
} from "@/lib/data";
import { runTournamentSimulation } from "@/lib/tournament/simulator";
import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";

export const GET = apiHandler(async (_request, { requestId }) => {
  const projection = runTournamentSimulation({
    iterations: 1,
    seed: "api-groups-projection",
  });

  return jsonOk(
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      groups: getTeamsByGroup(),
      projectedTables: projection.single.groupTables,
      bestThirdPlace: projection.single.bestThirdPlace,
    },
    { requestId },
  );
});
