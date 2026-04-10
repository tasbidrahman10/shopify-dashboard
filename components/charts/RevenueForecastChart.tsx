"use client";

import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import type { RevenueForecast } from "@/lib/types";
import { formatCurrency, formatMonth } from "@/lib/formatters";

interface Props {
  forecast: RevenueForecast;
}

const TREND_ICON = { up: "↑", down: "↓", flat: "→" } as const;
const TREND_COLOR = {
  up: "text-emerald-400",
  down: "text-red-400",
  flat: "text-gray-400",
} as const;
const CONFIDENCE_CLASS = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-red-500/15 text-red-400 border-red-500/30",
} as const;

export function RevenueForecastChart({ forecast }: Props) {
  const rPct = Math.round(forecast.rSquared * 100);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue Forecast</h3>
          <p className="mt-0.5 text-sm text-gray-500">
            Linear trend projection · next-month prediction
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">
              Projected ({formatMonth(forecast.forecastMonth)})
            </p>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(forecast.forecastRevenue)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className={`text-2xl font-bold leading-none ${TREND_COLOR[forecast.trend]}`}
            >
              {TREND_ICON[forecast.trend]}
            </span>
            <span
              className={`rounded border px-2 py-0.5 text-xs font-medium capitalize ${CONFIDENCE_CLASS[forecast.confidence]}`}
            >
              {forecast.confidence} confidence
            </span>
          </div>
        </div>
      </div>

      {/* R² progress bar */}
      <div className="mb-5 flex items-center gap-3">
        <span className="text-xs text-gray-500 whitespace-nowrap">
          Trend fit R²
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
            style={{ width: `${rPct}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 w-8 text-right">{rPct}%</span>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart
          data={forecast.chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="fcActualGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.4} />
            </linearGradient>
            <linearGradient id="fcForecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.4} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v) => formatCurrency(v as number)}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={62}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const isForecast = payload.some((p) => p.dataKey === "forecast");
              const value = payload[0]?.value as number | undefined;
              return (
                <div className="rounded-xl border border-white/10 bg-[#1a2035] px-4 py-3 shadow-xl">
                  <p className="mb-1 text-xs text-gray-400">
                    {formatMonth(label as string)}
                    {isForecast && (
                      <span className="ml-2 text-cyan-400">(Projected)</span>
                    )}
                  </p>
                  {value !== undefined && (
                    <p className="text-sm font-semibold text-white">
                      {formatCurrency(value)}
                    </p>
                  )}
                </div>
              );
            }}
          />
          <ReferenceLine
            x={forecast.forecastMonth}
            stroke="rgba(255,255,255,0.12)"
            strokeDasharray="5 4"
            label={{
              value: "Forecast →",
              fill: "#6b7280",
              fontSize: 10,
              position: "insideTopLeft",
            }}
          />
          <Bar
            dataKey="revenue"
            fill="url(#fcActualGrad)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
          <Bar
            dataKey="forecast"
            fill="url(#fcForecastGrad)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-5 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-indigo-500" />
          <span className="text-xs text-gray-500">Actual</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
          <span className="text-xs text-gray-500">Projected</span>
        </div>
      </div>
    </div>
  );
}
