import { DATASET_MODE, getProviderMode, getProviderNotice } from "@/lib/data";
import { handleRouteError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { simulateTournamentRequestSchema } from "@/lib/api/schemas";
import { runTournamentSimulation } from "@/lib/tournament/simulator";

export async function POST(request: Request) {
  try {
    const rateLimited = enforceRateLimit(request, {
      keyPrefix: "simulate-tournament",
      limit: 20,
      windowMs: 60_000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    const payload = simulateTournamentRequestSchema.parse(await request.json());
    const simulation = runTournamentSimulation(payload);

    return jsonOk({
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      simulation,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
