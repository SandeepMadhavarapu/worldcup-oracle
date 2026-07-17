import { z } from "zod";

import { teams } from "@/lib/data";
import { MAX_PUBLIC_SIMULATIONS } from "@/lib/tournament/constants";

const teamIds = new Set(teams.map((team) => team.id));

export const predictMatchRequestSchema = z
  .object({
    teamAId: z.string().min(1),
    teamBId: z.string().min(1),
  })
  .refine((value) => value.teamAId !== value.teamBId, {
    message: "Teams must be different",
    path: ["teamBId"],
  })
  .refine((value) => teamIds.has(value.teamAId), {
    message: "Unknown Team A",
    path: ["teamAId"],
  })
  .refine((value) => teamIds.has(value.teamBId), {
    message: "Unknown Team B",
    path: ["teamBId"],
  });

export const simulateTournamentRequestSchema = z.object({
  iterations: z
    .number()
    .int()
    .min(1)
    .max(MAX_PUBLIC_SIMULATIONS, {
      message: `Public demo simulations are capped at ${MAX_PUBLIC_SIMULATIONS}.`,
    })
    .default(MAX_PUBLIC_SIMULATIONS),
  seed: z.string().trim().min(1).max(80).default("worldcup-oracle"),
});

export const saveBracketRequestSchema = z
  .object({
    name: z.string().trim().min(2).max(40),
    championTeamId: z.string().min(1),
    finalistTeamId: z.string().min(1).optional(),
  })
  .refine((value) => teamIds.has(value.championTeamId), {
    message: "Unknown champion team",
    path: ["championTeamId"],
  })
  .refine(
    (value) => !value.finalistTeamId || teamIds.has(value.finalistTeamId),
    {
      message: "Unknown finalist team",
      path: ["finalistTeamId"],
    },
  );

export const teamPathRequestSchema = z.object({
  teamId: z
    .string()
    .min(1)
    .refine((id) => teamIds.has(id), {
      message: "Unknown team",
      path: ["teamId"],
    }),
});

export type PredictMatchRequest = z.infer<typeof predictMatchRequestSchema>;
export type SimulateTournamentRequest = z.infer<
  typeof simulateTournamentRequestSchema
>;
export type SaveBracketRequest = z.infer<typeof saveBracketRequestSchema>;
export type TeamPathRequest = z.infer<typeof teamPathRequestSchema>;

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
