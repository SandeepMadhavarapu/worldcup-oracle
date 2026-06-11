export {
  BUCKET_COUNT,
  brierScore,
  bucketIndex,
  buildCalibrationReport,
  buildReliabilityDiagram,
  matchBrier,
  outcomeVector,
  runningBrierScore,
} from "@/lib/calibration/calibration";
export { getDemoResolvedMatches } from "@/lib/calibration/demo-data";
export {
  buildResolvedMatchesFromLive,
  liveMatchToResolvedMatch,
  loadLiveResolvedMatches,
  outcomeFromScore,
} from "@/lib/calibration/live-results";
export {
  ILLUSTRATIVE_LABEL,
  ILLUSTRATIVE_NOTE,
  liveLabel,
  liveNote,
  selectCalibrationSource,
} from "@/lib/calibration/source";
export { normalizeTeamName, resolveTeamId } from "@/lib/calibration/team-resolver";
export type {
  CalibrationSource,
  CalibrationSourceKind,
} from "@/lib/calibration/source";
export type {
  CalibrationReport,
  MatchOutcome,
  OutcomeProbabilities,
  ReliabilityBucket,
  ResolvedMatch,
  RunningBrierPoint,
} from "@/lib/calibration/types";
