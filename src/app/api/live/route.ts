import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { getLiveScores } from "@/lib/live/service";

export const GET = apiHandler(async (_request, { requestId }) => {
  // Served from the in-memory 45s cache; the provider is hit at most once per
  // window. loadLiveScores never throws, so this is resilient by design.
  const payload = await getLiveScores();
  return jsonOk(payload, { requestId });
});
