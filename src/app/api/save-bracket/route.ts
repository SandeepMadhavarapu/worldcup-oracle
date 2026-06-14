import { apiHandler } from "@/lib/api/handler";
import { jsonOk, readJsonBody } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { saveBracketRequestSchema } from "@/lib/api/schemas";
import { saveDemoBracket } from "@/lib/leaderboard/store";

const JSON_BODY_MAX_BYTES = 4_096;

export const POST = apiHandler(async (request, { requestId }) => {
  const rateLimited = enforceRateLimit(request, {
    keyPrefix: "save-bracket",
    limit: 30,
    windowMs: 60_000,
  });

  if (rateLimited) {
    return rateLimited;
  }

  const payload = saveBracketRequestSchema.parse(
    await readJsonBody(request, { maxBytes: JSON_BODY_MAX_BYTES }),
  );
  const entry = await saveDemoBracket(payload);

  return jsonOk(
    {
      mode: "Demo placeholder leaderboard",
      scoreNote:
        "Scores are model-aligned demo points from the cached baseline simulation, not real match-result grading.",
      entry,
    },
    { requestId },
  );
});
