"use client";

import {
  CartesianGrid,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ResponsiveContainer,
} from "recharts";

import type { ReliabilityBucket } from "@/lib/calibration/types";

interface ReliabilityPoint {
  predicted: number;
  observed: number;
  count: number;
  range: string;
}

function toPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function ReliabilityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ReliabilityPoint }[];
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const point = payload[0].payload;

  return (
    <div className="rounded-md border border-white/12 bg-[#0d1a15] p-3 text-xs text-zinc-200 shadow-xl">
      <p className="font-semibold text-white">Forecast bucket {point.range}</p>
      <p className="mt-1">
        Predicted: <span className="font-semibold text-emerald-200">{toPercent(point.predicted)}</span>
      </p>
      <p>
        Observed: <span className="font-semibold text-cyan-200">{toPercent(point.observed)}</span>
      </p>
      <p className="mt-1 text-zinc-400">{point.count} forecasts</p>
    </div>
  );
}

export function ReliabilityDiagram({
  buckets,
}: {
  buckets: ReliabilityBucket[];
}) {
  const points: ReliabilityPoint[] = buckets
    .filter(
      (bucket): bucket is ReliabilityBucket & { predicted: number; observed: number } =>
        bucket.count > 0 && bucket.predicted !== null && bucket.observed !== null,
    )
    .map((bucket) => ({
      predicted: bucket.predicted,
      observed: bucket.observed,
      count: bucket.count,
      range: `${toPercent(bucket.rangeStart)}–${toPercent(bucket.rangeEnd)}`,
    }));

  return (
    <div
      className="h-[420px] min-h-[420px] min-w-0 w-full"
      role="img"
      aria-label={
        points.length === 0
          ? "Reliability diagram: no populated forecast buckets yet."
          : `Reliability diagram plotting predicted probability against observed frequency across ${points.length} populated forecast buckets. The full values are listed in the per-bucket detail table beside this chart.`
      }
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={0}
        initialDimension={{ width: 720, height: 420 }}
      >
        <ScatterChart margin={{ top: 12, right: 16, bottom: 28, left: 8 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" />
          <XAxis
            type="number"
            dataKey="predicted"
            name="Predicted"
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            tickFormatter={toPercent}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            label={{
              value: "Predicted probability",
              position: "insideBottom",
              offset: -16,
              fill: "#a1a1aa",
              fontSize: 12,
            }}
          />
          <YAxis
            type="number"
            dataKey="observed"
            name="Observed"
            domain={[0, 1]}
            ticks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
            tickFormatter={toPercent}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            label={{
              value: "Observed frequency",
              angle: -90,
              position: "insideLeft",
              offset: 18,
              fill: "#a1a1aa",
              fontSize: 12,
            }}
          />
          <ZAxis type="number" dataKey="count" range={[80, 620]} name="Samples" />
          {/* Perfect-calibration reference: predicted == observed. */}
          <ReferenceLine
            segment={[
              { x: 0, y: 0 },
              { x: 1, y: 1 },
            ]}
            stroke="#67e8f9"
            strokeDasharray="6 6"
            strokeWidth={1.5}
            ifOverflow="hidden"
          />
          <Tooltip
            content={<ReliabilityTooltip />}
            cursor={{ stroke: "rgba(255,255,255,0.18)", strokeDasharray: "3 3" }}
          />
          <Scatter
            data={points}
            fill="#6ee7b7"
            fillOpacity={0.78}
            stroke="#10b981"
            strokeWidth={1}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
