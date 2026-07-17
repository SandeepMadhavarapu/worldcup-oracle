import { DATASET_MODE } from "@/lib/data/teams";
import { readLiveDataProvider } from "@/lib/env";
import type { ApiMeta, ProviderMode } from "@/lib/types";

function readProvider(): "none" | "football-data" {
  // Throws loudly on an invalid value instead of silently degrading to the
  // sample dataset — see src/lib/env.ts.
  return readLiveDataProvider();
}

export function getProviderMode(): ProviderMode {
  const provider = readProvider();

  if (provider === "football-data" && process.env.FOOTBALL_DATA_API_KEY) {
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
    return "Live Provider Mode: a live provider is configured server-side. Predictions remain educational estimates and are not official tournament projections.";
  }

  if (mode === "OFFLINE_DATASET_MODE") {
    return "Offline Dataset Mode: a live provider was selected, but required server-side API keys are missing. The app is using local sample data.";
  }

  return "Sample Dataset Mode: local demo data is used for engineering review. No live scores or official tournament predictions are shown.";
}

export function createApiMeta(requestId: string): ApiMeta {
  return {
    requestId,
    datasetMode: DATASET_MODE,
    providerMode: getProviderMode(),
    generatedAt: new Date().toISOString(),
  };
}
