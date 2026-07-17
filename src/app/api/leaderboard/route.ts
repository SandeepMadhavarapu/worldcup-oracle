import { getProviderNotice } from "@/lib/data";
import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { getLeaderboard } from "@/lib/leaderboard/store";

export const GET = apiHandler(async (request, { requestId }) => {
  const rateLimited = enforceRateLimit(request, {
    keyPrefix: "leaderboard",
    limit: 120,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  return jsonOk(
    {
      mode: "Demo placeholder leaderboard",
      scoreNote:
        "Scores are model-aligned demo points from the cached baseline simulation, not real match-result grading.",
      notice: getProviderNotice(),
      entries: await getLeaderboard(),
    },
    { requestId },
  );
});
