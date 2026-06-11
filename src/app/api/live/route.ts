import { handleRouteError, jsonOk } from "@/lib/api/http";
import { getLiveScores } from "@/lib/live/service";

export async function GET() {
  try {
    // Served from the in-memory 45s cache; the provider is hit at most once per
    // window. loadLiveScores never throws, so this is resilient by design.
    const payload = await getLiveScores();
    return jsonOk(payload);
  } catch (error) {
    return handleRouteError(error);
  }
}
