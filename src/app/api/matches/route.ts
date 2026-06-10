import {
  DATASET_MODE,
  getWorldCup2026Dataset,
  getProviderMode,
  getProviderNotice,
  historicalResults,
} from "@/lib/data";
import { createTournamentMatches } from "@/lib/tournament/simulator";
import { jsonOk } from "@/lib/api/http";

export async function GET() {
  return jsonOk({
    datasetMode: DATASET_MODE,
    providerMode: getProviderMode(),
    notice: getProviderNotice(),
    tournamentStructure: createTournamentMatches(),
    worldCup2026Dataset: getWorldCup2026Dataset(),
    historicalSample: {
      rows: historicalResults.length,
      matches: historicalResults,
    },
  });
}
