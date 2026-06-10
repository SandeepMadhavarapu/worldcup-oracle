import { DATASET_MODE } from "@/lib/data/teams";
import type { ApiMeta, ProviderMode } from "@/lib/types";

type LiveProvider = "none" | "football-data" | "api-football";

function readProvider(): LiveProvider {
  const provider = process.env.LIVE_DATA_PROVIDER;

  if (provider === "football-data" || provider === "api-football") {
    return provider;
  }

  return "none";
}

export function getProviderMode(): ProviderMode {
  const provider = readProvider();

  if (provider === "football-data" && process.env.FOOTBALL_DATA_API_KEY) {
    return "LIVE_PROVIDER_MODE";
  }

  if (provider === "api-football" && process.env.API_FOOTBALL_KEY) {
    return "LIVE_PROVIDER_MODE";
  }

  if (provider !== "none") {
    return "OFFLINE_DATASET_MODE";
  }

  return "SAMPLE_DATASET_MODE";
}

export function getProviderNotice(): string {
  const mode = getProviderMode();

  if (mode === "LIVE_PROVIDER_MODE") {
    return "Live provider mode is configured server-side. Predictions remain educational estimates and are not official FIFA projections.";
  }

  if (mode === "OFFLINE_DATASET_MODE") {
    return "Offline Dataset Mode: a live provider was selected, but required server-side API keys are missing. The app is using local sample data.";
  }

  return "Sample Dataset Mode: local demo data is used for engineering review. No live scores or official FIFA predictions are shown.";
}

export function createApiMeta(requestId: string): ApiMeta {
  return {
    requestId,
    datasetMode: DATASET_MODE,
    providerMode: getProviderMode(),
    generatedAt: new Date().toISOString(),
  };
}
