import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { teamPathRequestSchema } from "@/lib/api/schemas";
import { DATASET_MODE, getProviderMode, getProviderNotice } from "@/lib/data";
import { getTeamPathReport } from "@/lib/tournament/team-path";

export const GET = apiHandler(async (request, { requestId }) => {
  const { searchParams } = new URL(request.url);
  const { teamId } = teamPathRequestSchema.parse({
    teamId: searchParams.get("teamId") ?? undefined,
  });

  // Reads the cached baseline simulation — no new Monte Carlo pass.
  const path = getTeamPathReport(teamId);

  return jsonOk(
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      path,
    },
    { requestId },
  );
});
