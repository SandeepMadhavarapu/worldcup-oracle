import type { Metadata } from "next";
import { connection } from "next/server";
import { Database, ShieldCheck } from "lucide-react";

import {
  DataStatusCard,
  DataTable,
  DatasetModeBadge,
  EmptyDataState,
  SourceBadge,
  type DataTableColumn,
} from "@/components/data-center";
import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { TextureBackground } from "@/components/texture-background";
import {
  DATA_CENTER_DATASET_MODE,
  DATA_CENTER_TOURNAMENT_DATASET_MODE,
  getDataCenterSnapshot,
  type CalibrationEvidenceRow,
  type FixtureDataRow,
  type LiveResultRow,
  type ModelInputRow,
  type PredictionOutputRow,
  type SimulationSummaryRow,
  type TeamDataRow,
} from "@/lib/data-center/summary";

export const metadata: Metadata = {
  title: "Data Credibility Center | WorldCup Oracle",
  description:
    "A transparent view of WorldCup Oracle data sources, model inputs, live provider status, calibration evidence, simulations, and demo persistence limits.",
};

const teamColumns: Array<DataTableColumn<TeamDataRow>> = [
  { key: "team", header: "Team", render: (row) => row.team },
  { key: "code", header: "Code", render: (row) => row.code },
  { key: "group", header: "Group", render: (row) => row.group },
  { key: "rating", header: "Rating/Elo", render: (row) => row.rating },
  { key: "attack", header: "Attack", render: (row) => row.attack },
  { key: "defense", header: "Defense", render: (row) => row.defense },
  { key: "form", header: "Form", render: (row) => row.form },
  {
    key: "source",
    header: "Source",
    render: (row) => (
      <div className="space-y-2">
        <SourceBadge kind={row.sourceKind}>Sample</SourceBadge>
        <p className="max-w-xs text-xs leading-5 text-zinc-400">
          {row.sourceLabel}
        </p>
      </div>
    ),
  },
];

const fixtureColumns: Array<DataTableColumn<FixtureDataRow>> = [
  { key: "match", header: "Match", render: (row) => row.match },
  { key: "kickoff", header: "Kickoff", render: (row) => row.kickoff },
  { key: "homeTeam", header: "Home", render: (row) => row.homeTeam },
  { key: "awayTeam", header: "Away", render: (row) => row.awayTeam },
  { key: "stage", header: "Stage", render: (row) => row.stage },
  { key: "venue", header: "Venue", render: (row) => row.venue },
  { key: "status", header: "Status", render: (row) => row.status },
  { key: "score", header: "Score", render: (row) => row.score },
  {
    key: "source",
    header: "Source",
    render: (row) => (
      <div className="space-y-2">
        <SourceBadge kind={row.sourceKind}>
          {row.sourceKind === "placeholder" ? "Placeholder" : "Manual seed"}
        </SourceBadge>
        <p className="max-w-xs text-xs leading-5 text-zinc-400">
          {row.sourceLabel}
        </p>
      </div>
    ),
  },
];

const liveColumns: Array<DataTableColumn<LiveResultRow>> = [
  { key: "match", header: "Match", render: (row) => row.match },
  { key: "kickoff", header: "Kickoff", render: (row) => row.kickoff },
  { key: "homeTeam", header: "Home", render: (row) => row.homeTeam },
  { key: "awayTeam", header: "Away", render: (row) => row.awayTeam },
  { key: "stage", header: "Stage", render: (row) => row.stage },
  { key: "status", header: "Status", render: (row) => row.status },
  { key: "score", header: "Score", render: (row) => row.score },
  { key: "sourceLabel", header: "Source", render: (row) => row.sourceLabel },
  { key: "lastUpdated", header: "Last updated", render: (row) => row.lastUpdated },
];

const modelColumns: Array<DataTableColumn<ModelInputRow>> = [
  { key: "team", header: "Team", render: (row) => row.team },
  { key: "rating", header: "Rating", render: (row) => row.rating },
  { key: "attack", header: "Attack factor", render: (row) => row.attack },
  { key: "defense", header: "Defense factor", render: (row) => row.defense },
  { key: "form", header: "Recent form", render: (row) => row.form },
  { key: "modelVersion", header: "Model version", render: (row) => row.modelVersion },
  { key: "assumptions", header: "Assumptions", render: (row) => row.assumptions },
];

const predictionColumns: Array<DataTableColumn<PredictionOutputRow>> = [
  { key: "match", header: "Match", render: (row) => row.match },
  { key: "homeWin", header: "Home win", render: (row) => row.homeWin },
  { key: "draw", header: "Draw", render: (row) => row.draw },
  { key: "awayWin", header: "Away win", render: (row) => row.awayWin },
  { key: "score", header: "Likely score", render: (row) => row.mostLikelyScore },
  { key: "confidence", header: "Confidence", render: (row) => row.confidence },
  { key: "factors", header: "Top factors", render: (row) => row.topFactors },
  { key: "modelVersion", header: "Model version", render: (row) => row.modelVersion },
];

const simulationColumns: Array<DataTableColumn<SimulationSummaryRow>> = [
  { key: "team", header: "Team", render: (row) => row.team },
  { key: "champion", header: "Champion", render: (row) => row.champion },
  { key: "final", header: "Final", render: (row) => row.final },
  { key: "semifinal", header: "Semifinal", render: (row) => row.semifinal },
  { key: "quarterfinal", header: "Quarterfinal", render: (row) => row.quarterfinal },
  { key: "advancement", header: "Advancement", render: (row) => row.advancement },
  { key: "tags", header: "Tags", render: (row) => row.tags },
  { key: "simulationCount", header: "Sims", render: (row) => row.simulationCount },
  { key: "seed", header: "Seed", render: (row) => row.seed },
  { key: "modelVersion", header: "Model version", render: (row) => row.modelVersion },
];

const calibrationColumns: Array<DataTableColumn<CalibrationEvidenceRow>> = [
  { key: "match", header: "Match", render: (row) => row.match },
  { key: "kickoff", header: "Kickoff", render: (row) => row.kickoff },
  { key: "predicted", header: "Predicted probabilities", render: (row) => row.predicted },
  { key: "pick", header: "Predicted pick", render: (row) => row.predictedPick },
  { key: "actual", header: "Actual", render: (row) => row.actual },
  { key: "brier", header: "Brier contribution", render: (row) => row.brier },
  {
    key: "source",
    header: "Source",
    render: (row) => (
      <div className="space-y-2">
        <SourceBadge kind={row.sourceKind}>
          {row.sourceKind === "live" ? "Live" : "Illustrative"}
        </SourceBadge>
        <p className="max-w-xs text-xs leading-5 text-zinc-400">
          {row.sourceLabel}
        </p>
      </div>
    ),
  },
];

export default async function DataCenterPage() {
  await connection();
  const snapshot = await getDataCenterSnapshot();
  const freshness = snapshot.fixtureFreshness;
  const persistence = snapshot.persistence;
  const freshnessStats = [
    ["Curated fixtures", freshness.curatedFixtureCount.toLocaleString()],
    [
      "Completed curated results",
      freshness.completedCuratedResultCount.toLocaleString(),
    ],
    ["Placeholder slots", freshness.placeholderCount.toLocaleString()],
    ["Live provider rows", freshness.liveProviderRowCount.toLocaleString()],
  ];

  return (
    <Shell>
      <TextureBackground variant="bracket" />
      <Section className="bg-[#0b1712]">
        <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-end">
          <div className="max-w-3xl">
            <StatusPill tone="cyan">Data Credibility Center</StatusPill>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
              The real data behind WorldCup Oracle
            </h1>
            <p className="mt-4 text-base leading-8 text-zinc-400">
              A read-only audit surface for sample data, live provider state,
              model inputs, generated predictions, simulations, calibration
              evidence, and demo persistence limits. It does not expose secrets
              and does not label sample data as live.
            </p>
          </div>
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 text-emerald-200" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">
                Mode labels
              </h2>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <DatasetModeBadge mode={DATA_CENTER_DATASET_MODE} kind="sample" />
              <DatasetModeBadge
                mode={snapshot.providerMode}
                kind={
                  snapshot.providerMode === "LIVE_PROVIDER_MODE"
                    ? "live"
                    : snapshot.providerMode === "OFFLINE_DATASET_MODE"
                      ? "offline"
                      : "sample"
                }
              />
              <DatasetModeBadge
                mode={DATA_CENTER_TOURNAMENT_DATASET_MODE}
                kind="placeholder"
              />
              <DatasetModeBadge mode="DEMO_PERSISTENCE" kind="demo" />
            </div>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              {snapshot.providerNotice}
            </p>
          </Card>
        </div>
      </Section>

      <Section className="pb-0">
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3">
                <Database className="size-5 text-emerald-200" aria-hidden="true" />
                <h2 className="text-2xl font-semibold text-white">
                  Fixture / Result Freshness
                </h2>
              </div>
              <p className="mt-4 text-lg font-semibold text-white">
                {freshness.headline}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {freshness.detail}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <SourceBadge kind={freshness.sourceKind}>
                {freshness.liveProviderAvailable
                  ? "Live provider connected"
                  : "Curated static seed"}
              </SourceBadge>
              <StatusPill
                tone={freshness.staticDatasetIncomplete ? "amber" : "emerald"}
              >
                {freshness.staticDatasetIncomplete
                  ? "Static dataset incomplete"
                  : "Static fixture set complete"}
              </StatusPill>
              <StatusPill
                tone={freshness.liveProviderAvailable ? "emerald" : "amber"}
              >
                {freshness.liveProviderAvailable
                  ? "Live provider data available"
                  : "Live provider data unavailable"}
              </StatusPill>
            </div>
          </div>
          <div className="mt-6 grid gap-0 overflow-hidden rounded-md border border-white/10 md:grid-cols-4">
            {freshnessStats.map(([label, value]) => (
              <div
                key={label}
                className="border-b border-white/10 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      <Section>
        <div className="mb-5 flex items-center gap-3">
          <Database className="size-5 text-emerald-200" aria-hidden="true" />
          <h2 className="text-2xl font-semibold text-white">
            Data Source Status
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.statusItems.map((item) => (
            <DataStatusCard
              key={item.label}
              label={item.label}
              value={item.value}
              detail={item.detail}
              kind={item.sourceKind}
            />
          ))}
        </div>
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Teams Table"
          description="All teams currently available to the model. Ratings are sample-seeded and updated from the local historical importer."
          columns={teamColumns}
          rows={snapshot.teams}
          getRowKey={(row) => row.code}
          minWidth="920px"
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Fixtures / Matches Table"
          description="The official-data-ready 2026 fixture structure currently contains a small manual seed and bracket placeholders. It is not a complete official fixture feed."
          columns={fixtureColumns}
          rows={snapshot.fixtures}
          getRowKey={(row) => row.match}
          minWidth="1120px"
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Live / Resolved Results Table"
          description="Provider-returned World Cup matches when football-data.org is configured and available."
          columns={liveColumns}
          rows={snapshot.liveResults}
          getRowKey={(row) => row.match}
          minWidth="1120px"
          emptyState={
            <EmptyDataState
              title="No provider results available"
              detail={
                snapshot.liveEmptyReason ??
                "The live provider returned no rows for the current window."
              }
            />
          }
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Model Inputs Table"
          description="Team-level model inputs used by the prediction engine. These are derived from sample seed values and local historical rows."
          columns={modelColumns}
          rows={snapshot.modelInputs}
          getRowKey={(row) => row.team}
          minWidth="1080px"
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Prediction Output Table"
          description="Generated sample predictions from the current model. These are educational examples, not live official forecasts."
          columns={predictionColumns}
          rows={snapshot.predictions}
          getRowKey={(row) => row.match}
          minWidth="1160px"
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Simulation Summary Table"
          description="Cached baseline Monte Carlo summary, reused across the app to avoid repeated expensive simulation work."
          columns={simulationColumns}
          rows={snapshot.simulations}
          getRowKey={(row) => row.team}
          minWidth="1240px"
        />
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Calibration Evidence Table"
          description="Rows used to produce the calibration report. When no real results have resolved, these rows are clearly labeled illustrative."
          columns={calibrationColumns}
          rows={snapshot.calibrationEvidence}
          getRowKey={(row, index) => `${row.match}-${index}`}
          minWidth="1180px"
        />
      </Section>

      <Section className="bg-[#10120d]">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <Database className="size-6 text-violet-200" aria-hidden="true" />
            <h2 className="text-2xl font-semibold text-white">
              Persistence / Leaderboard Honesty Panel
            </h2>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Leaderboard mode", persistence.leaderboardMode],
              ["Bracket storage mode", persistence.bracketStorageMode],
              ["Durable storage", persistence.durableStorage],
              ["Reset limitation", persistence.resetLimitation],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-white/10 bg-white/[0.04] p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                  {label}
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-lg border border-violet-300/20 bg-violet-300/10 p-5">
            <h3 className="text-base font-semibold text-violet-100">
              Required before public beta
            </h3>
            <ul className="mt-3 grid gap-2 text-sm leading-6 text-zinc-300 md:grid-cols-2">
              {persistence.publicBetaNeeds.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Card>
      </Section>
    </Shell>
  );
}
