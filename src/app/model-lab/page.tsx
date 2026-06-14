import {
  AlertTriangle,
  BrainCircuit,
  Database,
  FlaskConical,
  Gauge,
  ShieldAlert,
} from "lucide-react";

import { DataTable, type DataTableColumn } from "@/components/data-center";
import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { getProviderMode, getProviderNotice, historicalResults } from "@/lib/data";
import { buildTeamRatings } from "@/lib/prediction/elo";
import { runBacktestScaffold } from "@/lib/prediction/backtest";
import {
  buildModelInputRows,
  type ModelInputRow,
} from "@/lib/data-center/summary";
import { MODEL_VERSION } from "@/lib/tournament/simulator";
import type { ProviderMode } from "@/lib/types";

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

interface AssumptionRow {
  area: string;
  implementation: string;
  limitation: string;
}

const modelInputColumns: Array<DataTableColumn<ModelInputRow>> = [
  { key: "team", header: "Team", render: (row) => row.team },
  { key: "rating", header: "Rating", render: (row) => row.rating },
  { key: "attack", header: "Attack", render: (row) => row.attack },
  { key: "defense", header: "Defense", render: (row) => row.defense },
  { key: "form", header: "Recent form", render: (row) => row.form },
  { key: "modelVersion", header: "Model version", render: (row) => row.modelVersion },
  { key: "assumptions", header: "Assumptions", render: (row) => row.assumptions },
];

const assumptionRows: AssumptionRow[] = [
  {
    area: "Training data",
    implementation: "Compact local historical sample updates seed ratings.",
    limitation: "Not a complete international results database.",
  },
  {
    area: "Match context",
    implementation: "Neutral-venue assumption with rating, form, attack, and defense factors.",
    limitation: "No injuries, lineups, rest, travel, weather, or tactical matchup feed.",
  },
  {
    area: "Score model",
    implementation: "Expected goals are converted into a Poisson-style scoreline matrix.",
    limitation: "Educational baseline, not an out-of-sample forecasting claim.",
  },
  {
    area: "Simulation",
    implementation: "Deterministic seeds make Monte Carlo runs reproducible.",
    limitation: "Round-of-32 placement remains approximate until complete official fixtures are curated.",
  },
];

const assumptionColumns: Array<DataTableColumn<AssumptionRow>> = [
  { key: "area", header: "Area", render: (row) => row.area },
  {
    key: "implementation",
    header: "Current implementation",
    render: (row) => row.implementation,
  },
  { key: "limitation", header: "Limitation", render: (row) => row.limitation },
];

const providerModeLabels: Record<ProviderMode, string> = {
  LIVE_PROVIDER_MODE: "live provider connected",
  OFFLINE_DATASET_MODE: "offline dataset mode",
  SAMPLE_DATASET_MODE: "sample dataset mode",
};

export default function ModelLabPage() {
  const ratings = buildTeamRatings();
  const backtest = runBacktestScaffold(historicalResults, ratings);
  const modelInputs = buildModelInputRows(ratings, MODEL_VERSION);
  const providerMode = getProviderMode();

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
            not use official tournament predictions, does not provide betting advice,
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

      <Section className="pt-0">
        <DataTable
          title="Model Input Table"
          description="The same team-level inputs used by generated predictions. Values come from sample seed data plus local historical updates."
          columns={modelInputColumns}
          rows={modelInputs}
          getRowKey={(row) => row.team}
          minWidth="1080px"
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Assumptions Table"
          description="Plain-language boundaries for what the model does and does not know."
          columns={assumptionColumns}
          rows={assumptionRows}
          getRowKey={(row) => row.area}
          minWidth="820px"
        />
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
                <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                  Historical rows
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-white">
                  {historicalResults.length}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                  Live provider
                </dt>
                <dd className="mt-1 text-2xl font-semibold text-white">
                  {providerModeLabels[providerMode]}
                </dd>
              </div>
              <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
                <dt className="text-xs uppercase tracking-[0.16em] text-zinc-400">
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
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Evaluable sample rows
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {backtest.evaluatedMatches}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
                Log loss
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {backtest.logLoss?.toFixed(3) ?? "N/A"}
              </p>
            </div>
            <div className="rounded-md border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-zinc-400">
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
