import { apiHandler } from "@/lib/api/handler";
import { jsonOk } from "@/lib/api/http";
import { buildCalibrationReport } from "@/lib/calibration/calibration";
import { getCalibrationSource } from "@/lib/calibration/server";
import { DATASET_MODE, getProviderMode, getProviderNotice } from "@/lib/data";

export const GET = apiHandler(async (_request, { requestId }) => {
  const source = await getCalibrationSource();
  const report = buildCalibrationReport(source.matches);

  return jsonOk(
    {
      datasetMode: DATASET_MODE,
      providerMode: getProviderMode(),
      notice: getProviderNotice(),
      // Honest labeling: real graded results vs. the synthetic illustration. The
      // two are never blended — `source` is exactly one of them.
      source: source.kind,
      synthetic: !source.isLive,
      resolvedCount: source.resolvedCount,
      label: source.label,
      datasetExplanation: source.note,
      report,
    },
    { requestId },
  );
});
