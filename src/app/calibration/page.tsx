import type { Metadata } from "next";
import { Gauge, ScanLine, Sigma, Target } from "lucide-react";

import {
  DataTable,
  SourceBadge,
  type DataTableColumn,
} from "@/components/data-center";
import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { ReliabilityDiagram } from "@/app/calibration/reliability-diagram";
import { buildCalibrationReport } from "@/lib/calibration/calibration";
import { getCalibrationSource } from "@/lib/calibration/server";
import { getProviderNotice } from "@/lib/data";
import {
  buildCalibrationEvidenceRows,
  type CalibrationEvidenceRow,
} from "@/lib/data-center/summary";

export const metadata: Metadata = {
  title: "Calibration | WorldCup Oracle",
  description:
    "Reliability diagram and Brier score for the WorldCup Oracle prediction engine — graded against real World Cup results once matches resolve, and against a clearly-labeled synthetic illustration until then.",
};

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

const evidenceColumns: Array<DataTableColumn<CalibrationEvidenceRow>> = [
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

export default async function CalibrationPage() {
  const source = await getCalibrationSource();
  const report = buildCalibrationReport(source.matches);
  const populatedBuckets = report.buckets.filter((bucket) => bucket.count > 0);
  const evidenceRows = buildCalibrationEvidenceRows(source);
  const isLive = source.isLive;

  const stats = [
    {
      icon: ScanLine,
      label: "Real matches resolved",
      value: source.resolvedCount.toLocaleString(),
      detail: isLive
        ? "Finished World Cup matches graded from the live feed."
        : "None yet — the diagram below is an illustration until the first match finishes.",
    },
    {
      icon: Sigma,
      label: "Brier score",
      value: report.brierScore === null ? "N/A" : report.brierScore.toFixed(3),
      detail:
        "Multi-class, win/draw/loss. 0 is perfect, 2 is worst; guessing 1/3 everywhere scores 0.667.",
    },
    {
      icon: Sigma,
      label: "Log loss",
      value: report.logLoss === null ? "N/A" : report.logLoss.toFixed(3),
      detail:
        "Mean negative log-likelihood of the actual outcome. Uniform guessing scores 1.099.",
    },
    {
      icon: Target,
      label: "Winner accuracy",
      value:
        report.accuracy === null
          ? "N/A"
          : `${(report.accuracy * 100).toFixed(1)}%`,
      detail:
        "How often the model's highest-probability pick was the actual result.",
    },
    {
      icon: Target,
      label: "Calibration error",
      value:
        report.calibrationError === null
          ? "N/A"
          : report.calibrationError.toFixed(3),
      detail:
        "Count-weighted gap between stated confidence and observed frequency. 0 is perfect.",
    },
    {
      icon: ScanLine,
      label: "Graded forecasts",
      value: report.forecastCount.toLocaleString(),
      detail: "Three class forecasts per match across the diagram.",
    },
  ];

  return (
    <Shell>
      <Section className="bg-[#0b1712]">
        <div className="max-w-3xl">
          <StatusPill tone={isLive ? "emerald" : "amber"}>
            {isLive ? "Live Accuracy · Real Results" : "Illustrative · No Real Matches Yet"}
          </StatusPill>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Calibration
          </h1>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            Calibration checks whether the model&apos;s stated confidence matches
            reality: of all the forecasts made at <em>X%</em>, did about{" "}
            <em>X%</em> actually happen? {isLive
              ? "The reliability diagram below grades the engine against real, finished World Cup results."
              : "Until real matches resolve, the diagram below is a labeled illustration — it switches to real results automatically as the tournament plays out."}
          </p>
        </div>
      </Section>

      {/* The prominent, unmistakable source banner — this is how the page visibly
          comes alive as matches resolve. */}
      <Section className="pb-0">
        <div
          className={`flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
            isLive
              ? "border-emerald-300/30 bg-emerald-300/10"
              : "border-amber-300/25 bg-amber-300/10"
          }`}
        >
          <div className="flex items-center gap-4">
            <span
              className={`grid size-12 place-items-center rounded-lg text-xl font-bold tabular-nums ${
                isLive
                  ? "bg-emerald-300/15 text-emerald-100"
                  : "bg-amber-300/15 text-amber-100"
              }`}
            >
              {source.resolvedCount}
            </span>
            <div>
              <p
                className={`text-base font-semibold ${
                  isLive ? "text-emerald-100" : "text-amber-100"
                }`}
              >
                {source.label}
              </p>
              <p className="mt-0.5 text-sm leading-6 text-zinc-300/80">
                {isLive
                  ? "Real finished World Cup matches grading the model right now."
                  : "No real resolved matches are included yet; this view is illustrative until provider results arrive."}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
              isLive
                ? "bg-emerald-400/15 text-emerald-100"
                : "bg-amber-400/15 text-amber-100"
            }`}
          >
            {isLive ? "Live · real results" : "Illustrative · synthetic"}
          </span>
        </div>
      </Section>

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                    {item.label}
                  </p>
                  <span className="grid size-9 place-items-center rounded-md border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold text-white">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{item.detail}</p>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section className="pt-0">
        <Card className="overflow-hidden">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-lg font-semibold text-white">
              Accuracy by Confidence
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              The core calibration question in table form: when the model is
              more confident, is it actually right more often?
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                <tr>
                  <th className="px-5 py-3">Top-pick confidence</th>
                  <th className="px-3 py-3">Matches</th>
                  <th className="px-3 py-3">Avg confidence</th>
                  <th className="px-5 py-3">Top pick was right</th>
                </tr>
              </thead>
              <tbody>
                {report.confidenceBands.map((band) => (
                  <tr
                    key={`${band.rangeStart}`}
                    className="border-t border-white/5"
                  >
                    <td className="px-5 py-3 font-medium text-white">
                      {(band.rangeStart * 100).toFixed(0)}%–
                      {(band.rangeEnd * 100).toFixed(0)}%
                    </td>
                    <td className="px-3 py-3 text-zinc-300">{band.count}</td>
                    <td className="px-3 py-3 text-zinc-300">
                      {band.avgConfidence === null
                        ? "—"
                        : `${(band.avgConfidence * 100).toFixed(1)}%`}
                    </td>
                    <td className="px-5 py-3 font-semibold text-emerald-200">
                      {band.accuracy === null
                        ? "—"
                        : `${(band.accuracy * 100).toFixed(1)}%`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="p-5">
            <div className="flex items-center gap-3">
              <Gauge className="size-5 text-emerald-200" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-white">
                Reliability Diagram
              </h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-zinc-400">
              Predicted probability on the x-axis, observed frequency on the
              y-axis. Larger dots hold more forecasts. The dashed diagonal is
              perfect calibration — the closer the dots sit to it, the better.
            </p>
            <div className="mt-5">
              <ReliabilityDiagram buckets={report.buckets} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-white/10 p-5">
              <h2 className="text-lg font-semibold text-white">Per-Bucket Detail</h2>
              <p className="mt-1 text-sm text-zinc-400">
                The same data behind the diagram, as a table.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-zinc-400">
                  <tr>
                    <th className="px-5 py-3">Bucket</th>
                    <th className="px-3 py-3">Predicted</th>
                    <th className="px-3 py-3">Observed</th>
                    <th className="px-5 py-3">Samples</th>
                  </tr>
                </thead>
                <tbody>
                  {populatedBuckets.map((bucket) => (
                    <tr key={bucket.bucket} className="border-t border-white/5">
                      <td className="px-5 py-3 font-medium text-white">
                        {toPercent(bucket.rangeStart)}–{toPercent(bucket.rangeEnd)}
                      </td>
                      <td className="px-3 py-3 text-emerald-200">
                        {bucket.predicted === null ? "—" : toPercent(bucket.predicted)}
                      </td>
                      <td className="px-3 py-3 text-cyan-200">
                        {bucket.observed === null ? "—" : toPercent(bucket.observed)}
                      </td>
                      <td className="px-5 py-3 text-zinc-300">{bucket.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </Section>

      <Section className="pt-0">
        <DataTable
          title="Resolved Match Evidence Table"
          description="The row-level evidence behind the calibration report. Synthetic rows are labeled illustrative until real resolved matches arrive."
          columns={evidenceColumns}
          rows={evidenceRows}
          getRowKey={(row, index) => `${row.match}-${index}`}
          minWidth="1180px"
        />
      </Section>

      <Section className="bg-[#10120d]">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-white">
              What calibration means
            </h2>
            <p className="mt-4 text-sm leading-7 text-zinc-400">
              A forecast is well calibrated when its confidence is trustworthy at
              face value. If the model says a result is 70% likely, then across
              many such forecasts that result should occur roughly 70% of the
              time. The reliability diagram plots predicted confidence against
              what actually happened, so a perfectly calibrated model traces the
              diagonal line: predicted equals observed in every bucket. Dots
              above the line mean the model was under-confident (events happened
              more often than predicted); dots below mean it was over-confident.
              The Brier score condenses this into a single number — the mean
              squared error between the win/draw/loss forecast and the real
              outcome — where 0 is flawless and lower is always better. We track a
              running Brier score so the grade updates as each resolved match is
              added.
            </p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Target
                className={`size-6 ${isLive ? "text-emerald-200" : "text-amber-200"}`}
                aria-hidden="true"
              />
              <h2 className="text-xl font-semibold text-white">
                {isLive ? "Where these numbers come from" : "Honest data note"}
              </h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-400">
              <p>{getProviderNotice()}</p>
              <p>{source.note}{" "}
            {source.resultsFetchedAt
              ? `Results last fetched ${new Date(source.resultsFetchedAt).toISOString().slice(11, 16)} UTC; cached up to 5 minutes.`
              : ""}</p>
            </div>
          </Card>
        </div>
      </Section>
    </Shell>
  );
}
