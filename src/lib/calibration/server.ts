// Server-only wiring for the calibration page and API route. Pulls the real
// resolved results through the repository, pairs them with the synthetic
// illustration, and applies the pure real-vs-synthetic switch in one place so
// the page and the API can never disagree about which source is live.

import { getDemoResolvedMatches } from "@/lib/calibration/demo-data";
import {
  selectCalibrationSource,
  type CalibrationSource,
} from "@/lib/calibration/source";
import { resolvedMatchRepository } from "@/lib/repositories";

export async function getCalibrationSource(): Promise<CalibrationSource> {
  const realResolvedMatches = await resolvedMatchRepository.list();
  return selectCalibrationSource(realResolvedMatches, getDemoResolvedMatches());
}
