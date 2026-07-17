import {
  DATASET_MODE,
  getProviderMode,
  getProviderNotice,
  getTeamsByGroup,
} from "@/lib/data";
import { runTournamentSimulation } from "@/lib/tournament/simulator";
import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";

// The projection below is fully deterministic (1 iteration, fixed seed), so it
// is computed once per process and reused — recomputing an identical result on
// every request was pure waste.
let cachedProjection: ReturnType<typeof runTournamentSimulation> | null = null;

function getGroupsProjection() {
  if (!cachedProjection) {
    cachedProjection = runTournamentSimulation({
      iterations: 1,
      seed: "api-groups-projection",
    });
  }

  return cachedProjection;
}

export const GET = apiHandler(async (_request, { requestId }) => {
  const projection = getGroupsProjection();

  return jsonOk(
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      groups: getTeamsByGroup(),
      projectionNote:
        "Single deterministic simulated outcome (1 iteration, fixed seed) — an illustrative table, not a probabilistic forecast. Use /api/simulate-tournament for distributions.",
      projectedTables: projection.single.groupTables,
      bestThirdPlace: projection.single.bestThirdPlace,
    },
    { requestId },
  );
});
