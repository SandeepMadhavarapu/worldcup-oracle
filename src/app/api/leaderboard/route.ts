import { getProviderNotice } from "@/lib/data";
import { jsonOk } from "@/lib/api/http";
import { getLeaderboard } from "@/lib/leaderboard/store";

export async function GET() {
  return jsonOk({
    mode: "Demo Mode only",
    notice: getProviderNotice(),
    entries: await getLeaderboard(),
  });
}
