import { buildTeamRatings } from "@/lib/prediction/elo";
import { predictMatch } from "@/lib/prediction/match";
import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { predictMatchRequestSchema } from "@/lib/api/schemas";
import { DATASET_MODE, getProviderMode, getProviderNotice } from "@/lib/data";

export const POST = apiHandler(async (request, { requestId }) => {
  const rateLimited = enforceRateLimit(request, {
    keyPrefix: "predict-match",
    limit: 60,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const payload = predictMatchRequestSchema.parse(await request.json());
  const prediction = predictMatch(
    payload.teamAId,
    payload.teamBId,
    buildTeamRatings(),
  );

  return jsonOk(
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      prediction,
    },
    { requestId },
  );
});
