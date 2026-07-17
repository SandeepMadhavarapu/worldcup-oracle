import { DATASET_MODE, getProviderMode, getProviderNotice, teams } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { apiHandler } from "@/lib/api/handler";
import { jsonOkCacheable } from "@/lib/api/http";

export const GET = apiHandler(async (request, { requestId }) => {
  const ratings = buildTeamRatings();

  // Static in sample mode -> ETag + short shared-cache lifetime.
  return jsonOkCacheable(
    request,
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      teams,
      ratings: teams.map((team) => ratings.get(team.id)),
    },
    { requestId, maxAgeSeconds: 300 },
  );
});
