"use client";

import { useState, useCallback } from "react";
import { UploadZone } from "@/components/ui/UploadZone";
import { KPIRow } from "@/components/ui/KPIRow";
import { InsightsPanel } from "@/components/ui/InsightsPanel";
import { RevenueByMonthChart } from "@/components/charts/RevenueByMonthChart";
import { TopProductsChart } from "@/components/charts/TopProductsChart";
import { RevenueByCountryChart } from "@/components/charts/RevenueByCountryChart";
import { OrdersOverTimeChart } from "@/components/charts/OrdersOverTimeChart";
import { RevenueForecastChart } from "@/components/charts/RevenueForecastChart";
import { RFMSegmentChart } from "@/components/charts/RFMSegmentChart";
import { InventoryAlertsTable } from "@/components/charts/InventoryAlertsTable";
import { CohortHeatmapChart } from "@/components/charts/CohortHeatmapChart";
import { parseShopifyCSV } from "@/lib/parseShopifyCSV";
import type {
  AppState,
  InsightsState,
  ShopifyMetrics,
  InsightItem,
  InsightsRequestPayload,
} from "@/lib/types";

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [metrics, setMetrics] = useState<ShopifyMetrics | null>(null);
  const [parseError, setParseError] = useState<string | undefined>();

  const [insightsState, setInsightsState] = useState<InsightsState>("idle");
  const [insights, setInsights] = useState<InsightItem[]>([]);

  const fetchInsights = useCallback(async (m: ShopifyMetrics) => {
    setInsightsState("loading");
    try {
      const payload: InsightsRequestPayload = {
        totalRevenue: m.totalRevenue,
        totalOrders: m.totalOrders,
        averageOrderValue: m.averageOrderValue,
        bestMonth: m.bestMonth,
        dateRangeStart: m.dateRangeStart,
        dateRangeEnd: m.dateRangeEnd,
        topProductsByRevenue: m.topProductsByRevenue,
        topProductsByQuantity: m.topProductsByQuantity,
        revenueByCountry: m.revenueByCountry,
        revenueByMonth: m.revenueByMonth,
      };
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setInsights(data.insights ?? []);
      setInsightsState("success");
    } catch {
      setInsightsState("error");
    }
  }, []);

  function handleFileSelected(file: File) {
    setParseError(undefined);
    setAppState("parsing");

    // Defer parse slightly to allow spinner render to flush before CPU work
    setTimeout(async () => {
      try {
        const result = await parseShopifyCSV(file);
        setMetrics(result);
        setAppState("dashboard");
        fetchInsights(result);
      } catch (err) {
        const msg =
          err instanceof Error && err.message === "NO_PAID_ORDERS"
            ? "No paid orders found. Please upload a Shopify orders export with paid orders."
            : err instanceof Error && err.message === "NO_SHOPIFY_COLUMNS"
              ? "File doesn't look like a Shopify orders CSV. Please check and try again."
              : "Could not parse this file. Please upload a valid Shopify orders CSV.";
        setParseError(msg);
        setAppState("upload");
      }
    }, 50);
  }

  function handleNewUpload() {
    setAppState("upload");
    setMetrics(null);
    setParseError(undefined);
    setInsightsState("idle");
    setInsights([]);
  }

  // ── Upload / Parsing screen ──────────────────────────────────────────────
  if (appState === "upload" || appState === "parsing") {
    return (
      <div className="relative min-h-screen bg-[#0a0f1e]">
        <UploadZone
          onFileSelected={handleFileSelected}
          isParsing={appState === "parsing"}
          errorMessage={parseError}
        />
      </div>
    );
  }

  // ── Dashboard screen ─────────────────────────────────────────────────────
  if (!metrics) return null;

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0a0f1e]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white">
              Shopify Analytics
            </span>
            <span className="hidden rounded-full bg-indigo-500/15 px-2 py-0.5 text-xs text-indigo-400 sm:inline">
              {metrics.dateRangeStart} – {metrics.dateRangeEnd}
            </span>
          </div>
          <button
            onClick={handleNewUpload}
            className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.09] hover:text-white"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            New Upload
          </button>
        </div>
      </header>

      {/* Dashboard content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="stagger-children space-y-6">
          <KPIRow metrics={metrics} />
          <RevenueByMonthChart data={metrics.revenueByMonth} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TopProductsChart
              byRevenue={metrics.topProductsByRevenue}
              byQuantity={metrics.topProductsByQuantity}
            />
            <RevenueByCountryChart data={metrics.revenueByCountry} />
          </div>
          <OrdersOverTimeChart data={metrics.ordersOverTime} />

          {/* ── New analytics sections ─────────────────────────────── */}
          <RevenueForecastChart forecast={metrics.revenueForecast} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RFMSegmentChart analysis={metrics.rfmAnalysis} />
            <InventoryAlertsTable alerts={metrics.inventoryAlerts} />
          </div>
          <CohortHeatmapChart analysis={metrics.cohortAnalysis} />

          <InsightsPanel
            state={insightsState}
            insights={insights}
            onRetry={() => fetchInsights(metrics)}
          />
        </div>
      </main>

      <footer className="mt-8 border-t border-white/[0.05] py-6 text-center">
        <p className="text-xs text-gray-600">
          All data processed locally in your browser · AI insights via Gemini
        </p>
      </footer>
    </div>
  );
}
