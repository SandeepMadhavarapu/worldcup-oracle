import { getProviderNotice } from "@/lib/data";
import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { getLeaderboard } from "@/lib/leaderboard/store";

export const GET = apiHandler(async (_request, { requestId }) => {
  return jsonOk(
    {
      mode: "Demo Mode only",
      notice: getProviderNotice(),
      entries: await getLeaderboard(),
    },
    { requestId },
  );
});
