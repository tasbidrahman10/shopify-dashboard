"use client";

import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { OrdersTimePoint } from "@/lib/types";
import { formatNumber } from "@/lib/formatters";

interface OrdersOverTimeChartProps {
  data: OrdersTimePoint[];
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
        {formatNumber(payload[0].value)}{" "}
        <span className="text-sm font-normal text-gray-400">orders</span>
      </p>
    </div>
  );
}

function formatTick(value: string): string {
  // Week format "2024-W11" → "W11"
  if (value.includes("-W"))
    return value.split("-W")[1] ? `W${value.split("-W")[1]}` : value;
  // Date "2024-03-15" → "Mar 15"
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Show every Nth tick to avoid crowding
function buildTicks(data: OrdersTimePoint[]): string[] {
  if (data.length <= 12) return data.map((d) => d.date);
  const step = Math.ceil(data.length / 10);
  return data.filter((_, i) => i % step === 0).map((d) => d.date);
}

export function OrdersOverTimeChart({ data }: OrdersOverTimeChartProps) {
  const ticks = buildTicks(data);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Orders Over Time</h3>
          <p className="text-sm text-gray-500">Order volume trend</p>
        </div>
        <span className="rounded-lg bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-400">
          {data.length} {data[0]?.date.includes("-W") ? "weeks" : "days"}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart
          data={data}
          margin={{ top: 4, right: 4, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id="ordersAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            ticks={ticks}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTick}
          />
          <YAxis
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={36}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: "rgba(99,102,241,0.3)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="orders"
            fill="url(#ordersAreaGradient)"
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="orders"
            stroke="#818cf8"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: "#818cf8",
              stroke: "#1a2035",
              strokeWidth: 2,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
