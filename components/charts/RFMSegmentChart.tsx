"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { RFMAnalysis, RFMSegment } from "@/lib/types";
import { formatCurrency } from "@/lib/formatters";

interface Props {
  analysis: RFMAnalysis;
}

const SEGMENT_ORDER: RFMSegment[] = [
  "Champions",
  "Loyal Customers",
  "At Risk",
  "Lost",
  "New Customers",
];

function obfuscateEmail(email: string): string {
  const atIdx = email.indexOf("@");
  if (atIdx < 0) return "***";
  const local = email.substring(0, atIdx);
  const domain = email.substring(atIdx); // includes "@"
  const visible = local.length > 2 ? local[0] + local[1] : (local[0] ?? "");
  return `${visible}***${domain}`;
}

export function RFMSegmentChart({ analysis }: Props) {
  const { segments, topCustomers, totalCustomers } = analysis;

  if (totalCustomers === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-white">Customer Segments</h3>
        <p className="mt-4 text-sm text-gray-500">
          No customer data found — requires the{" "}
          <span className="font-mono text-gray-400">Email</span> column in your
          Shopify export.
        </p>
      </div>
    );
  }

  const colorMap = Object.fromEntries(
    segments.map((s) => [s.segment, s.color]),
  ) as Record<string, string>;

  // Sort segments in display order, skipping empty ones
  const displaySegments = SEGMENT_ORDER.filter((s) =>
    segments.find((x) => x.segment === s),
  ).map((s) => segments.find((x) => x.segment === s)!);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Customer Segments</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          RFM analysis · {totalCustomers} customers
        </p>
      </div>

      {/* Donut chart */}
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={displaySegments}
            dataKey="count"
            nameKey="segment"
            cx="50%"
            cy="50%"
            outerRadius={88}
            innerRadius={52}
            paddingAngle={2}
            strokeWidth={0}
          >
            {displaySegments.map((seg) => (
              <Cell key={seg.segment} fill={seg.color} />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof displaySegments)[number];
              return (
                <div className="rounded-xl border border-white/10 bg-[#1a2035] px-4 py-3 shadow-xl">
                  <p className="text-sm font-semibold text-white">
                    {d.segment}
                  </p>
                  <p className="text-xs text-gray-400">
                    {d.count} customers · {d.percentage}%
                  </p>
                  <p className="text-xs text-gray-400">
                    Avg spend: {formatCurrency(d.avgRevenue)}
                  </p>
                </div>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Segment legend rows */}
      <div className="mt-4 space-y-2">
        {displaySegments.map((seg) => (
          <div
            key={seg.segment}
            className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: seg.color }}
              />
              <span className="text-sm text-gray-300">{seg.segment}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="w-8 text-right text-xs text-gray-500">
                {seg.percentage}%
              </span>
              <span className="w-6 text-right text-sm font-medium text-white">
                {seg.count}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Top customers */}
      {topCustomers.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            Top Customers by Spend
          </p>
          <div className="space-y-2.5">
            {topCustomers.slice(0, 5).map((c) => (
              <div key={c.email} className="flex items-center justify-between">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate text-xs text-gray-400">
                    {obfuscateEmail(c.email)}
                  </span>
                  <span
                    className="flex-shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                    style={{
                      backgroundColor: `${colorMap[c.segment]}22`,
                      color: colorMap[c.segment],
                    }}
                  >
                    {c.segment}
                  </span>
                </div>
                <span className="ml-3 flex-shrink-0 text-xs font-medium text-white">
                  {formatCurrency(c.monetary)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
