"use client";

import type { CohortAnalysis } from "@/lib/types";
import { formatMonth } from "@/lib/formatters";

interface Props {
  analysis: CohortAnalysis;
}

/** Map a retention % (0–100) to an indigo RGBA background */
function cellBg(value: number, isBaseline: boolean): string {
  if (isBaseline) return "rgba(99,102,241,0.80)";
  if (value === 0) return "rgba(255,255,255,0.02)";
  const opacity = (value / 100) * 0.72 + 0.08;
  return `rgba(99,102,241,${opacity.toFixed(2)})`;
}

/** Text colour that stays readable against any cell shade */
function cellText(value: number, isBaseline: boolean): string {
  if (isBaseline || value >= 50) return "rgba(255,255,255,0.92)";
  if (value >= 20) return "rgba(255,255,255,0.70)";
  return "rgba(255,255,255,0.40)";
}

export function CohortHeatmapChart({ analysis }: Props) {
  const { rows, maxOffset } = analysis;

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
        <h3 className="text-lg font-semibold text-white">Cohort Retention</h3>
        <p className="mt-4 text-sm text-gray-500">
          Not enough data for cohort analysis — requires multiple months of
          orders with customer emails, and at least one returning buyer.
        </p>
      </div>
    );
  }

  const offsets = Array.from({ length: maxOffset + 1 }, (_, i) => i);

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 backdrop-blur-md">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">Cohort Retention</h3>
        <p className="mt-0.5 text-sm text-gray-500">
          Monthly retention by acquisition cohort · % of cohort who returned
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <thead>
            <tr>
              {/* Cohort label column */}
              <th className="pb-2 pr-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">
                Cohort
              </th>
              {/* Size column */}
              <th className="pb-2 pr-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap">
                n
              </th>
              {/* Offset columns */}
              {offsets.map((offset) => (
                <th
                  key={offset}
                  className="pb-2 text-center text-xs font-medium text-gray-500 whitespace-nowrap min-w-[52px]"
                >
                  {offset === 0 ? "M0" : `M+${offset}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.cohortMonth}>
                <td className="py-0.5 pr-3 text-xs font-medium text-gray-400 whitespace-nowrap">
                  {formatMonth(row.cohortMonth)}
                </td>
                <td className="py-0.5 pr-2 text-center text-xs text-gray-500">
                  {row.cohortSize}
                </td>
                {offsets.map((offset) => {
                  const value = row.retentionByOffset[offset];
                  const hasData = value !== undefined;
                  const isBaseline = offset === 0;
                  return (
                    <td key={offset} className="py-0.5">
                      <div
                        className="flex h-10 min-w-[52px] items-center justify-center rounded-md text-xs font-semibold"
                        style={{
                          backgroundColor: hasData
                            ? cellBg(value, isBaseline)
                            : "rgba(255,255,255,0.02)",
                          color: hasData
                            ? cellText(value, isBaseline)
                            : "rgba(255,255,255,0.15)",
                        }}
                        title={hasData ? `${value}% retained` : "No data yet"}
                      >
                        {hasData ? `${value}%` : "—"}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Colour scale legend */}
      <div className="mt-5 flex items-center gap-3">
        <span className="text-xs text-gray-500">Retention:</span>
        <div className="flex items-center gap-1">
          {[0, 25, 50, 75, 100].map((v) => (
            <div
              key={v}
              className="flex h-5 w-10 items-center justify-center rounded text-[10px] font-medium"
              style={{
                backgroundColor:
                  v === 0 ? "rgba(255,255,255,0.04)" : cellBg(v, false),
                color: cellText(v, false),
              }}
            >
              {v}%
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">Low → High</span>
      </div>

      <p className="mt-3 text-xs text-gray-600">
        M0 = acquisition month (always 100%). Each subsequent column shows the %
        of that cohort who placed any order in that month.
      </p>
    </div>
  );
}
