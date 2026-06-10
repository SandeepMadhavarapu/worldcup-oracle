import type { Metadata } from "next";
import { Gauge, ScanLine, Sigma, Target } from "lucide-react";

import { Card, Section, Shell, StatusPill } from "@/components/ui";
import { ReliabilityDiagram } from "@/app/calibration/reliability-diagram";
import { buildCalibrationReport } from "@/lib/calibration/calibration";
import { getProviderNotice } from "@/lib/data";
import { resolvedMatchRepository } from "@/lib/repositories";

export const metadata: Metadata = {
  title: "Calibration | WorldCup Oracle",
  description:
    "Self-grading reliability diagram and Brier score for the WorldCup Oracle prediction engine, using synthetic resolved matches in Demo Mode.",
};

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function CalibrationPage() {
  const resolvedMatches = await resolvedMatchRepository.list();
  const report = buildCalibrationReport(resolvedMatches);
  const populatedBuckets = report.buckets.filter((bucket) => bucket.count > 0);

  const stats = [
    {
      icon: Sigma,
      label: "Brier score",
      value: report.brierScore === null ? "N/A" : report.brierScore.toFixed(3),
      detail: "Multi-class, win/draw/loss. 0 is perfect, 2 is worst.",
    },
    {
      icon: ScanLine,
      label: "Resolved matches",
      value: report.sampleSize.toLocaleString(),
      detail: "Synthetic graded forecasts in the current sample.",
    },
    {
      icon: Target,
      label: "Pooled forecasts",
      value: report.forecastCount.toLocaleString(),
      detail: "Three class forecasts per match across the diagram.",
    },
  ];

  return (
    <Shell>
      <Section className="bg-[#0b1712]">
        <div className="max-w-3xl">
          <StatusPill tone="amber">Self-Grading · Demo Mode</StatusPill>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
            Calibration
          </h1>
          <p className="mt-4 text-base leading-8 text-zinc-400">
            Calibration checks whether the model&apos;s stated confidence matches
            reality: of all the forecasts made at <em>X%</em>, did about{" "}
            <em>X%</em> actually happen? The reliability diagram below grades the
            engine against its own resolved forecasts.
          </p>
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
              <Target className="size-6 text-amber-200" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-white">Honest data note</h2>
            </div>
            <div className="mt-4 space-y-4 text-sm leading-7 text-zinc-400">
              <p>{getProviderNotice()}</p>
              <p>
                These resolved matches are <strong>synthetic</strong>: each is
                forecast by the real engine, then its outcome is sampled from
                that same forecast distribution with a fixed seed. The set is
                deterministic and renders offline, and is calibrated by
                construction — so it illustrates what good calibration looks
                like rather than proving real-world accuracy. No live scores, no
                official FIFA data, not betting advice.
              </p>
            </div>
          </Card>
        </div>
      </Section>
    </Shell>
  );
}
