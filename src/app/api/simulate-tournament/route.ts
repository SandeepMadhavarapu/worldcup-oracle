import { DATASET_MODE, getProviderMode, getProviderNotice } from "@/lib/data";
import { apiHandler } from "@/lib/api/handler";
import { jsonOk, readJsonBody } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { simulateTournamentRequestSchema } from "@/lib/api/schemas";
import { runTournamentSimulation } from "@/lib/tournament/simulator";

const JSON_BODY_MAX_BYTES = 4_096;

export const POST = apiHandler(async (request, { requestId }) => {
  const rateLimited = enforceRateLimit(request, {
    keyPrefix: "simulate-tournament",
    limit: 20,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const payload = simulateTournamentRequestSchema.parse(
    await readJsonBody(request, { maxBytes: JSON_BODY_MAX_BYTES }),
  );
  const simulation = runTournamentSimulation(payload);

  return jsonOk(
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      simulation,
    },
    { requestId },
  );
});
