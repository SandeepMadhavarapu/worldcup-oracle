import { DATASET_MODE, getProviderMode, getProviderNotice, teams } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { jsonOk } from "@/lib/api/http";

export async function GET() {
  const ratings = buildTeamRatings();

  return jsonOk({
    datasetMode: DATASET_MODE,
    providerMode: getProviderMode(),
    notice: getProviderNotice(),
    teams,
    ratings: teams.map((team) => ratings.get(team.id)),
  });
}
