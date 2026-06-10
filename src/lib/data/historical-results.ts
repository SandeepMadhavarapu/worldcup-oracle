import { z } from "zod";

import rawHistoricalResults from "../../../data/sample/historical-results.json";
import type { HistoricalMatch } from "@/lib/types";

const historicalMatchSchema = z.object({
  date: z.string(),
  homeTeamId: z.string(),
  awayTeamId: z.string(),
  homeGoals: z.number().int().nonnegative(),
  awayGoals: z.number().int().nonnegative(),
  neutral: z.boolean(),
  competition: z.enum(["world_cup", "continental", "qualifier", "friendly"]),
});

const historicalResultsSchema = z.array(historicalMatchSchema);

export const historicalResults: HistoricalMatch[] =
  historicalResultsSchema.parse(rawHistoricalResults);
