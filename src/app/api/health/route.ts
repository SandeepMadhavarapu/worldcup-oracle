import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { getBuildInfo } from "@/lib/api/build-info";
import { DATASET_MODE, getProviderMode } from "@/lib/data";

// Liveness/readiness probe. Returns only non-secret build and mode identifiers,
// so it is safe to expose publicly and to point uptime checks at.
export const GET = apiHandler(async (_request, { requestId }) => {
  const build = getBuildInfo();

  return jsonOk(
    {
      status: "ok",
      version: build.version,
      build: build.build,
      commitRef: build.commitRef,
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
    { requestId },
  );
});
