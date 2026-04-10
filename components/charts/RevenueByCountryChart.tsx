"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CountryRevenue } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

interface RevenueByCountryChartProps {
  data: CountryRevenue[];
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a2035] px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-base font-bold text-white">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function RevenueByCountryChart({ data }: RevenueByCountryChartProps) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Revenue by Country</h3>
        <p className="text-sm text-gray-500">Top {data.length} markets</p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          barCategoryGap="25%"
        >
          <defs>
            <linearGradient id="pinkGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ec4899" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#a855f7" stopOpacity={1} />
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
            tickFormatter={(v) => formatCurrency(v)}
          />
          <YAxis
            type="category"
            dataKey="country"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={90}
            tickFormatter={(v: string) =>
              v.length > 12 ? v.substring(0, 11) + "…" : v
            }
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar
            dataKey="revenue"
            fill="url(#pinkGradient)"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
