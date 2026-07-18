import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Database,
  FlaskConical,
  GitBranch,
  Gauge,
  Layers,
  Shuffle,
} from "lucide-react";

import { Card, Section, Shell, StatusPill } from "@/components/ui";

export const metadata: Metadata = {
  title: "Methodology | WorldCup Oracle",
  description:
    "Exactly how WorldCup Oracle works: data, Elo-style ratings, Poisson scorelines, Monte Carlo simulation, live calibration, and reproducibility. No 'AI' hand-waving.",
};

const PIPELINE = [
  {
    icon: Database,
    title: "1 · Data",
    body: "A hand-authored 49-match sample dataset and a 48-team demo field with seeded ratings, attack/defense indices, form, and tournament pedigree. This is declared demo data — not scraped, not official, and version-controlled in the repository so every value has a history.",
  },
  {
    icon: Layers,
    title: "2 · Team strength (Elo-style)",
    body: "Ratings replay the sample results with a K-factor of 28, scaled by competition weight (World Cup 1.45× … friendly 0.72×), goal-margin multiplier (capped at 4-goal margins), a 3-year-half-life recency decay, and a 42-point home advantage zeroed on neutral venues.",
  },
  {
    icon: FlaskConical,
    title: "3 · Match probabilities (Poisson)",
    body: "Each side's expected goals come from a log-linear model over rating gap, attack vs. opposing defense, form, and pedigree, clamped to [0.22, 3.65]. A 7×7 Poisson scoreline grid (renormalized) yields win/draw/loss probabilities. There is no neural network and we never call this AI — it is a transparent statistical model.",
  },
  {
    icon: Shuffle,
    title: "4 · Tournament simulation (Monte Carlo)",
    body: "Seeded, reproducible runs sample every scoreline from the same Poisson model through the full 48-team format: groups, best-third qualification, Round of 32 through the final. Knockout draws resolve by weighted penalty coin-flip. Champion odds are frequencies over up to 1,000 runs.",
  },
  {
    icon: Gauge,
    title: "5 · Calibration & evaluation",
    body: "Finished real matches stream in from football-data.org and grade the engine's pre-match forecasts: multi-class Brier score, log loss, top-pick accuracy, expected calibration error, a reliability diagram, and accuracy-by-confidence bands. Real and synthetic sources are never blended, and unmappable matches are excluded and counted rather than guessed.",
  },
  {
    icon: GitBranch,
    title: "6 · Reproducibility",
    body: "Predictions are a pure function of the version-controlled dataset and constants — no hidden state, no post-hoc updates. Any pre-tournament commit rebuilds the exact same forecasts, so the git history acts as a public, tamper-evident freeze of what the model believed before results were known.",
  },
];

export default function MethodologyPage() {
  return (
    <Shell>
      <Section className="bg-[#0b1712]">
        <div className="max-w-3xl">
          <StatusPill tone="cyan">Full Transparency</StatusPill>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Methodology
          </h1>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            Everything the model does, end to end, with nothing hidden: what the
            data is, how ratings and probabilities are computed, how the
            tournament is simulated, and how the forecasts are graded against
            reality. If a number appears anywhere in this product, this page
            explains where it came from.
          </p>
        </div>
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PIPELINE.map((step) => {
            const Icon = step.icon;

            return (
              <Card key={step.title} className="p-5">
                <Icon className="size-6 text-emerald-200" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold text-white">
                  {step.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">
                  {step.body}
                </p>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white">
              What this model does <em className="text-emerald-200">not</em> do
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              No lineups, injuries, suspensions, travel, rest days, or weather.
              No machine-learned parameters — every constant is a documented
              engineering choice, not a fitted value, because the sample dataset
              is far too small to fit against. Penalty shootouts are a weighted
              coin flip; FIFA&apos;s deepest tiebreak criteria are replaced with
              deterministic jitter; and the Round-of-32 third-place mapping is
              an approximation, flagged as such in simulation metadata. The
              constants and their rationale live in{" "}
              <a
                className="text-emerald-200 underline underline-offset-4"
                href="https://github.com/SandeepMadhavarapu/worldcup-oracle/blob/master/docs/model-notes.md"
              >
                docs/model-notes.md
              </a>
              .
            </p>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white">
              How to audit the claims
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              The accuracy numbers on the{" "}
              <Link
                className="text-emerald-200 underline underline-offset-4"
                href="/calibration"
              >
                Calibration page
              </Link>{" "}
              are computed from real finished matches at request time and state
              exactly how many finished matches could not be graded. Because the
              dataset and code are public, any pre-tournament commit of the
              repository reproduces the exact forecasts being graded — the
              freeze is enforced by version control, not by trust.
            </p>
            <Link
              href="/calibration"
              className="mt-5 inline-flex h-11 items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-4 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
            >
              See the live grades
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </Section>
    </Shell>
  );
}
