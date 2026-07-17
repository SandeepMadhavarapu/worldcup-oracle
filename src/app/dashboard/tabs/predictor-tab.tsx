"use client";

import { BrainCircuit, LineChart, Loader2, Sparkles } from "lucide-react";

import { Card, ProbabilityBar, StatusPill } from "@/components/ui";
import type { MatchPrediction, Team } from "@/lib/types";
import { pct, SelectTeam } from "./shared";

export function PredictorTab({
  teams,
  teamAId,
  teamBId,
  setTeamAId,
  setTeamBId,
  prediction,
  isPredicting,
  runPrediction,
  getTeamName,
}: {
  teams: Team[];
  teamAId: string;
  teamBId: string;
  setTeamAId: (teamId: string) => void;
  setTeamBId: (teamId: string) => void;
  prediction: MatchPrediction | null;
  isPredicting: boolean;
  runPrediction: () => void;
  getTeamName: (teamId: string) => string;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <BrainCircuit className="size-5 text-emerald-200" aria-hidden="true" />
          <h2 className="text-lg font-semibold text-white">
            Match Predictor
          </h2>
        </div>
        <div className="mt-5 grid gap-4">
          <SelectTeam
            label="Team A"
            value={teamAId}
            teams={teams}
            onChange={setTeamAId}
          />
          <SelectTeam
            label="Team B"
            value={teamBId}
            teams={teams}
            onChange={setTeamBId}
          />
          <button
            type="button"
            onClick={runPrediction}
            disabled={isPredicting || teamAId === teamBId}
            aria-busy={isPredicting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-emerald-300 px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-200 active:scale-[0.98] motion-reduce:active:scale-100 disabled:cursor-not-allowed disabled:opacity-55 disabled:active:scale-100"
          >
            {isPredicting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <LineChart className="size-4" aria-hidden="true" />
            )}
            {isPredicting ? "Running..." : "Run prediction"}
          </button>
        </div>
      </Card>
      <Card className="p-5">
        {prediction ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusPill tone="emerald">
                  Confidence {pct(prediction.confidence)}
                </StatusPill>
                <StatusPill tone="cyan">
                  Rating gap {prediction.ratingGap}
                </StatusPill>
              </div>
              <div className="mt-6 space-y-5">
                {[
                  {
                    label: `${getTeamName(prediction.teamAId)} win`,
                    value: prediction.probabilities.teamAWin,
                  },
                  {
                    label: "Draw",
                    value: prediction.probabilities.draw,
                  },
                  {
                    label: `${getTeamName(prediction.teamBId)} win`,
                    value: prediction.probabilities.teamBWin,
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-zinc-200">
                        {item.label}
                      </span>
                      <span className="font-semibold text-white">
                        {pct(item.value)}
                      </span>
                    </div>
                    <ProbabilityBar value={item.value} />
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-md border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-semibold text-white">
                  Why this prediction?
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
                  {prediction.explanation.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {prediction.factors.map((factor) => (
                    <div
                      key={factor.label}
                      className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                        {factor.label}
                      </p>
                      <p className="mt-1 font-semibold text-white">
                        {factor.value}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {factor.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Scoreline distribution
              </h3>
              <div className="mt-4 space-y-3">
                {prediction.topScorelines.map((scoreline) => (
                  <div
                    key={`${scoreline.homeGoals}-${scoreline.awayGoals}`}
                    className="rounded-md border border-white/10 bg-white/[0.04] p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">
                        {scoreline.homeGoals}-{scoreline.awayGoals}
                      </span>
                      <span className="text-sm text-zinc-300">
                        {pct(scoreline.probability)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProbabilityBar value={scoreline.probability} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-zinc-400">
                {prediction.uncertainty}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[420px] place-items-center text-center">
            <div className="max-w-xs">
              <Sparkles
                className="mx-auto size-10 text-emerald-200"
                aria-hidden="true"
              />
              <p className="mt-4 text-lg font-semibold text-white">
                Select two teams to generate an explainable prediction.
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Pick from the dropdowns on the left, then run the model to
                see win, draw, and loss probabilities with a plain-English
                rationale.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
