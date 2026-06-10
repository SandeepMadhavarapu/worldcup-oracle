import { handleRouteError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { saveBracketRequestSchema } from "@/lib/api/schemas";
import { saveDemoBracket } from "@/lib/leaderboard/store";

export async function POST(request: Request) {
  try {
    const rateLimited = enforceRateLimit(request, {
      keyPrefix: "save-bracket",
      limit: 30,
      windowMs: 60_000,
    });

    if (rateLimited) {
      return rateLimited;
    }

    const payload = saveBracketRequestSchema.parse(await request.json());
    const entry = await saveDemoBracket(payload);

    return jsonOk({
      mode: "Demo Mode only",
      entry,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
