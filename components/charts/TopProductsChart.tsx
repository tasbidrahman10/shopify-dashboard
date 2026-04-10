"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ProductMetric } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/formatters";

interface TopProductsChartProps {
  byRevenue: ProductMetric[];
  byQuantity: ProductMetric[];
}

function RevenueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: ProductMetric }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a2035] px-4 py-3 shadow-xl">
      <p className="max-w-[180px] text-xs text-gray-400">
        {payload[0].payload.name}
      </p>
      <p className="mt-1 text-base font-bold text-white">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

function QuantityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { value: number; payload: ProductMetric }[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a2035] px-4 py-3 shadow-xl">
      <p className="max-w-[180px] text-xs text-gray-400">
        {payload[0].payload.name}
      </p>
      <p className="mt-1 text-base font-bold text-white">
        {formatNumber(payload[0].value)} units
      </p>
    </div>
  );
}

export function TopProductsChart({
  byRevenue,
  byQuantity,
}: TopProductsChartProps) {
  const [tab, setTab] = useState<"revenue" | "quantity">("revenue");
  const data = tab === "revenue" ? byRevenue : byQuantity;
  const isRevenue = tab === "revenue";

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Top Products</h3>
          <p className="text-sm text-gray-500">Best performing items</p>
        </div>
        <div className="flex rounded-lg bg-white/[0.05] p-1">
          <button
            onClick={() => setTab("revenue")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              tab === "revenue"
                ? "bg-emerald-500/20 text-emerald-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setTab("quantity")}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
              tab === "quantity"
                ? "bg-amber-500/20 text-amber-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Units
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          barCategoryGap="25%"
        >
          <defs>
            <linearGradient id="emeraldGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#34d399" stopOpacity={1} />
            </linearGradient>
            <linearGradient id="amberGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity={1} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) =>
              isRevenue ? formatCurrency(v) : formatNumber(v)
            }
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={100}
            tickFormatter={(v: string) =>
              v.length > 14 ? v.substring(0, 13) + "…" : v
            }
          />
          <Tooltip
            content={isRevenue ? <RevenueTooltip /> : <QuantityTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar
            dataKey={isRevenue ? "revenue" : "quantity"}
            fill={isRevenue ? "url(#emeraldGradient)" : "url(#amberGradient)"}
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
