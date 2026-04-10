"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { MonthRevenue } from "@/lib/types";
import { formatCurrency, formatMonth } from "@/lib/formatters";

interface RevenueByMonthChartProps {
  data: MonthRevenue[];
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
      <p className="text-xs text-gray-400">{label ? formatMonth(label) : ""}</p>
      <p className="mt-1 text-base font-bold text-white">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function RevenueByMonthChart({ data }: RevenueByMonthChartProps) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Revenue by Month</h3>
          <p className="text-sm text-gray-500">Monthly sales performance</p>
        </div>
        <span className="rounded-lg bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400">
          {data.length} months
        </span>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
          barCategoryGap="30%"
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="month"
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => {
              const parts = v.split("-");
              if (parts.length < 2) return v;
              const d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
              return d.toLocaleDateString("en-US", { month: "short" });
            }}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatCurrency(v)}
            width={60}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(99,102,241,0.08)" }}
          />
          <Bar
            dataKey="revenue"
            fill="url(#revenueGradient)"
            radius={[6, 6, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                opacity={entry.revenue === maxRevenue ? 1 : 0.75}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
