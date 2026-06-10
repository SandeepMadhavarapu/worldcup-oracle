import {
  AlertTriangle,
  BrainCircuit,
  Database,
  FlaskConical,
  Gauge,
  ShieldAlert,
} from "lucide-react";

import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { getProviderNotice, historicalResults } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { runBacktestScaffold } from "@/lib/prediction/backtest";

const inputs = [
  {
    icon: Gauge,
    title: "Elo-style rating",
    body: "Each team starts with a seed rating and receives weighted updates from the sample historical importer.",
  },
  {
    icon: Database,
    title: "Competition weighting",
    body: "World Cup rows influence ratings more than continental tournaments, qualifiers, and friendlies.",
  },
  {
    icon: BrainCircuit,
    title: "Scoreline model",
    body: "Expected goals are converted into a Poisson-style distribution across common football scores.",
  },
  {
    icon: FlaskConical,
    title: "Monte Carlo simulation",
    body: "The simulator repeats group and knockout paths with deterministic seeds for reproducible runs.",
  },
];

export default function ModelLabPage() {
  const backtest = runBacktestScaffold(historicalResults, buildTeamRatings());

  return (
    <Shell>
      <Section className="bg-[#0b1712]">
        <div className="max-w-3xl">
          <StatusPill tone="amber">Transparency Page</StatusPill>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Model Lab
          </h1>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            WorldCup Oracle is an educational sports analytics project. It does
            not use official FIFA predictions, does not provide betting advice,
            and does not present sample data as live data.
          </p>
        </div>
      </Section>

      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {inputs.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.title} className="p-5">
                <Icon className="size-6 text-emerald-200" aria-hidden="true" />
                <h2 className="mt-4 text-xl font-semibold text-white">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">{item.body}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section className="bg-[#10120d]">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <ShieldAlert className="size-6 text-rose-200" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">Limitations</h2>
            </div>
            <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-400">
              <p>{getProviderNotice()}</p>
              <p>
                The Round-of-32 pairing is a deterministic bracket approximation
                for a portfolio MVP. The advancement count and third-place
                ranking follow the 48-team structure, while official fixture
                matrices can be wired in once a verified data provider is added.
              </p>
              <p>
                The model is calibrated for interpretability and engineering
                clarity, not for real-world forecasting superiority.
              </p>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-6 text-amber-200" aria-hidden="true" />
              <h2 className="text-2xl font-semibold text-white">Data Mode</h2>
            </div>
            <dl className="mt-5 grid gap-4">
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Historical rows
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-white">
                  {historicalResults.length}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Live provider
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-white">none</dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                  Betting advice
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-white">never</dd>
              </div>
            </dl>
          </Card>
        </div>
      </Section>

      <Section>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <FlaskConical className="size-6 text-cyan-200" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-white">
              Backtesting Scaffold
            </h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Evaluable sample rows
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {backtest.evaluatedMatches}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Log loss
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {backtest.logLoss?.toFixed(3) ?? "N/A"}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                Brier score
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {backtest.brierScore?.toFixed(3) ?? "N/A"}
              </p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-zinc-400">{backtest.note}</p>
        </Card>
      </Section>
    </Shell>
  );
}
