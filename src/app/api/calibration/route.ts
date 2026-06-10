import { handleRouteError, jsonOk } from "@/lib/api/http";
import { buildCalibrationReport } from "@/lib/calibration/calibration";
import { DATASET_MODE, getProviderMode, getProviderNotice } from "@/lib/data";
import { resolvedMatchRepository } from "@/lib/repositories";

export async function GET() {
  try {
    const resolvedMatches = await resolvedMatchRepository.list();
    const report = buildCalibrationReport(resolvedMatches);

    return jsonOk({
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      // Honest labeling: this graded set is synthetic, not real results.
      synthetic: true,
      datasetExplanation:
        "Demo Mode: synthetic resolved matches whose outcomes are sampled from the model's own forecast distribution. Illustrative of calibration only — not real results.",
      report,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
