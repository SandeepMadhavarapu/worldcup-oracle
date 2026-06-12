import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Swords, Trophy } from "lucide-react";

import { Card, ProbabilityBar, Section, Shell, StatusPill } from "@/components/ui";
import { TextureBackground } from "@/components/texture-background";
import { teams } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { getBaselineSimulation } from "@/lib/tournament/baseline";
import { getTeamPathReport } from "@/lib/tournament/team-path";

export function generateStaticParams() {
  return teams.map((team) => ({ id: team.id }));
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = teams.find((item) => item.id === id);

  if (!team) {
    notFound();
  }

  const ratings = buildTeamRatings();
  const rating = ratings.get(team.id);
  // Reuse the single cached baseline simulation — no per-team Monte Carlo pass.
  const simulation = getBaselineSimulation();
  const probability = simulation.probabilities.find((row) => row.teamId === team.id);

  if (!probability) {
    notFound();
  }

  const pathReport = getTeamPathReport(team.id);
  const readableRun = pathReport.steps
    .map((step) => `beat ${step.opponentName} in ${step.roundLabel}`)
    .join(", ");

  const rows = [
    ["Reach Round of 32", probability.roundOf32],
    ["Reach Round of 16", probability.roundOf16],
    ["Reach Quarter-finals", probability.quarterFinal],
    ["Reach Semi-finals", probability.semiFinal],
    ["Reach Final", probability.final],
    ["Win Tournament", probability.champion],
  ] as const;

  return (
    <Shell>
      <TextureBackground variant="bracket" />
      <Section className="bg-[#0b1712]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 hover:text-emerald-100"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Dashboard
        </Link>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <StatusPill tone="cyan">
              {team.confederation} | Group {team.group}
            </StatusPill>
            <h1 className="mt-5 text-5xl font-semibold tracking-normal text-white">
              {team.name}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-8 text-zinc-400">
              Team intelligence combines seed strength, sample historical form,
              attack-defense balance, and tournament simulation outcomes.
            </p>
          </div>
          <Card className="p-5">
            <div
              className="mb-5 h-2 rounded"
              style={{ backgroundColor: team.accent }}
            />
            <div className="flex items-center gap-3">
              <Trophy className="size-5 text-amber-200" aria-hidden="true" />
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-400">
                Champion probability
              </p>
            </div>
            <p className="mt-3 text-4xl font-semibold text-white">
              {(probability.champion * 100).toFixed(1)}%
            </p>
          </Card>
        </div>
      </Section>

      <Section>
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white">Rating Profile</h2>
            <dl className="mt-5 grid gap-4">
              {[
                ["Rating", Math.round(rating?.rating ?? team.eloSeed).toString()],
                ["Recent form", (rating?.form ?? team.form).toFixed(1)],
                ["Attack", (rating?.attack ?? team.attack).toFixed(2)],
                ["Defense", (rating?.defense ?? team.defense).toFixed(2)],
                ["World Cup pedigree", team.worldCupPedigree.toFixed(2)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between border-b border-white/10 pb-3"
                >
                  <dt className="text-sm text-zinc-400">{label}</dt>
                  <dd className="font-semibold text-white">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-white">
              Probability by Round
            </h2>
            <div className="mt-5 space-y-5">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-zinc-200">{label}</span>
                    <span className="font-semibold text-white">
                      {(value * 100).toFixed(1)}%
                    </span>
                  </div>
                  <ProbabilityBar value={value} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section className="bg-[#10120d]">
        <div className="flex items-center gap-3">
          <Swords className="size-6 text-emerald-200" aria-hidden="true" />
          <h2 className="text-2xl font-semibold text-white">
            Upset-Path Explorer
          </h2>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Conditional structure read from the same{" "}
          {pathReport.iterations.toLocaleString()} cached Monte Carlo
          simulations — no extra run.
        </p>

        <Card className="mt-6 p-6">
          {pathReport.hasTitleRun ? (
            <>
              <p className="text-base leading-8 text-zinc-200">
                Reaches the final in{" "}
                <span className="font-semibold text-white">
                  {(pathReport.finalProbability * 100).toFixed(1)}%
                </span>{" "}
                of sims; most common title run:{" "}
                <span className="text-white">{readableRun}</span>.
              </p>
              <p className="mt-3 text-sm leading-7 text-zinc-400">
                Wins the title in{" "}
                {(pathReport.championProbability * 100).toFixed(1)}% of sims.
                This exact opponent sequence recurred in{" "}
                {pathReport.modalCount.toLocaleString()} of{" "}
                {pathReport.titleCount.toLocaleString()} simulated titles —
                exact full runs vary widely across the field.
              </p>

              <ol className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3">
                {pathReport.steps.map((step, index) => (
                  <li key={step.round} className="flex items-center gap-2">
                    {index > 0 ? (
                      <ChevronRight
                        className="size-4 text-zinc-600"
                        aria-hidden="true"
                      />
                    ) : null}
                    <span className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-2 text-sm">
                      <span className="font-semibold text-emerald-200">
                        {step.roundLabel}
                      </span>{" "}
                      <span className="text-zinc-200">{step.opponentName}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-base leading-8 text-zinc-300">
              Reaches the final in{" "}
              <span className="font-semibold text-white">
                {(pathReport.finalProbability * 100).toFixed(1)}%
              </span>{" "}
              of sims, but did not win the title in any of the{" "}
              {pathReport.iterations.toLocaleString()} simulations — so there is
              no modal title run to show yet.
            </p>
          )}
        </Card>
      </Section>
    </Shell>
  );
}
