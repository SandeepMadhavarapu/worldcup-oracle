import {
  DATASET_MODE,
  getWorldCup2026Dataset,
  getProviderMode,
  getProviderNotice,
  historicalResults,
} from "@/lib/data";
import { createTournamentMatches } from "@/lib/tournament/simulator";
import { apiHandler } from "@/lib/api/handler";
import { jsonOkCacheable } from "@/lib/api/http";
import { paginationQuerySchema } from "@/lib/api/schemas";

export const GET = apiHandler(async (request, { requestId }) => {
  const { searchParams } = new URL(request.url);
  const { limit, offset } = paginationQuerySchema.parse({
    limit: searchParams.get("limit") ?? undefined,
    offset: searchParams.get("offset") ?? undefined,
  });

  // Sample-mode data is static per deploy, so this read is cacheable with an
  // ETag; historical rows are paginated so the payload stops growing linearly
  // with the dataset.
  return jsonOkCacheable(
    request,
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      tournamentStructure: createTournamentMatches(),
      worldCup2026Dataset: getWorldCup2026Dataset(),
      historicalSample: {
        pagination: { limit, offset, total: historicalResults.length },
        rows: historicalResults.length,
        matches: historicalResults.slice(offset, offset + limit),
      },
    },
    { requestId, maxAgeSeconds: 300 },
  );
});
