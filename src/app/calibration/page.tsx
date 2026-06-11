import type { Metadata } from "next";
import { Gauge, ScanLine, Sigma, Target } from "lucide-react";

import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { ReliabilityDiagram } from "@/app/calibration/reliability-diagram";
import { buildCalibrationReport } from "@/lib/calibration/calibration";
import { getCalibrationSource } from "@/lib/calibration/server";
import { getProviderNotice } from "@/lib/data";

export const metadata: Metadata = {
  title: "Calibration | WorldCup Oracle",
  description:
    "Reliability diagram and Brier score for the WorldCup Oracle prediction engine — graded against real World Cup results once matches resolve, and against a clearly-labeled synthetic illustration until then.",
};

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function CalibrationPage() {
  const source = await getCalibrationSource();
  const report = buildCalibrationReport(source.matches);
  const populatedBuckets = report.buckets.filter((bucket) => bucket.count > 0);
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
      detail: "Multi-class, win/draw/loss. 0 is perfect, 2 is worst.",
    },
    {
      icon: Target,
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
                  : "Real resolved World Cup matches. The count climbs as games finish."}
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
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
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
              <p className="mt-1 text-sm text-zinc-500">
                The same data behind the diagram, as a table.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-zinc-500">
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
              <p>{source.note}</p>
            </div>
          </Card>
        </div>
      </Section>
    </Shell>
  );
}
