"use client";

import type { InventoryAlerts, InventoryStatus } from "@/lib/types";
import { formatMonth } from "@/lib/formatters";

interface Props {
  alerts: InventoryAlerts;
}

const STATUS_CONFIG: Record<
  InventoryStatus,
  { label: string; className: string }
> = {
  "Low Stock Risk": {
    label: "Low Stock Risk",
    className: "bg-red-500/15 text-red-400 border border-red-500/25",
  },
  "Fast Moving": {
    label: "Fast Moving",
    className: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
  },
  Stable: {
    label: "Stable",
    className:
      "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
  },
  Declining: {
    label: "Declining",
    className: "bg-gray-500/15 text-gray-400 border border-gray-500/25",
  },
};

export function InventoryAlertsTable({ alerts }: Props) {
  const { products, analysisMonth } = alerts;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">Inventory Alerts</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Sales velocity · through {formatMonth(analysisMonth)}
        </p>
      </div>

      <div className="max-h-[430px] overflow-y-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[#0d1326]">
            <tr>
              <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Product
              </th>
              <th className="pb-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Units/Mo
              </th>
              <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                MoM
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {products.map((p) => {
              const cfg = STATUS_CONFIG[p.status];
              const accColor =
                p.accelerationPct > 0
                  ? "text-emerald-400"
                  : p.accelerationPct < 0
                    ? "text-red-400"
                    : "text-gray-400";
              return (
                <tr
                  key={p.name}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="py-3 pr-4">
                    <p className="text-sm text-gray-200">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.totalUnits} total units
                    </p>
                  </td>
                  <td className="py-3 text-center">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-3 text-right text-sm font-medium text-white">
                    {p.last30DayVelocity.toFixed(1)}
                  </td>
                  <td
                    className={`py-3 text-right text-sm font-medium ${accColor}`}
                  >
                    {p.accelerationPct > 0 ? "+" : ""}
                    {p.accelerationPct.toFixed(1)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 border-t border-white/[0.05] pt-4">
        {(Object.keys(STATUS_CONFIG) as InventoryStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_CONFIG[s].className}`}
            >
              {s}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
