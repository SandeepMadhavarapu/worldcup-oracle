// Server-only wiring for the calibration page and API route. Pulls the real
// resolved results through the repository, pairs them with the synthetic
// illustration, and applies the pure real-vs-synthetic switch in one place so
// the page and the API can never disagree about which source is live.

import { getDemoResolvedMatches } from "@/lib/calibration/demo-data";
import { getLiveGradingResult } from "@/lib/calibration/live-results-service";
import {
  selectCalibrationSource,
  type CalibrationSource,
} from "@/lib/calibration/source";

export async function getCalibrationSource(): Promise<CalibrationSource> {
  const grading = await getLiveGradingResult();

  return selectCalibrationSource(grading.matches, getDemoResolvedMatches(), {
    finishedCount: grading.finishedCount,
    skippedCount: grading.skippedCount,
  });
}
