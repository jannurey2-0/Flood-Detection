"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HourlyPoint } from "@/lib/weather";
import { formatAxisTick, formatHourDay } from "@/lib/format";

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: HourlyPoint }>;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
      <p className="font-medium text-slate-200">{formatHourDay(point.time)}</p>
      <p className="mt-1 text-sky-300">
        {point.precipitationMm.toFixed(1)} mm rain
      </p>
      <p className="text-amber-300">{Math.round(point.probability)}% chance</p>
    </div>
  );
}

export function RainChart({ hourly }: { hourly: HourlyPoint[] }) {
  return (
    <section
      aria-label="Hourly rainfall chart for the next 48 hours"
      className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
            Next 48 hours
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Hourly rainfall and chance of rain
          </p>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-sky-400" /> Rain (mm)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-amber-300" /> Chance (%)
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={hourly}
            margin={{ top: 8, right: 4, bottom: 0, left: -16 }}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(148, 163, 184, 0.12)"
            />
            <XAxis
              dataKey="time"
              tickFormatter={formatAxisTick}
              minTickGap={32}
              interval="preserveStartEnd"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="rain"
              width={44}
              allowDecimals={false}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="chance"
              orientation="right"
              domain={[0, 100]}
              ticks={[0, 50, 100]}
              width={36}
              tickFormatter={(value: number) => `${value}%`}
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            />
            <Bar
              yAxisId="rain"
              dataKey="precipitationMm"
              fill="#38bdf8"
              radius={[3, 3, 0, 0]}
              maxBarSize={14}
              isAnimationActive={false}
            />
            <Line
              yAxisId="chance"
              type="monotone"
              dataKey="probability"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
