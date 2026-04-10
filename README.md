# Shopify AI Analytics Dashboard

An intelligent, browser-first analytics dashboard for Shopify stores. Upload your orders CSV export and instantly get interactive charts, AI-generated insights, revenue forecasting, customer segmentation, inventory alerts, and cohort retention analysis — all without a backend or login.

---

## Features

### Core Analytics

- **Revenue by Month** — Bar chart of monthly revenue with gradient fills
- **Top Products** — Horizontal bar chart toggleable between revenue and units sold
- **Revenue by Country** — Geographic revenue breakdown (top 10 markets)
- **Orders Over Time** — Area + line chart, auto-bucketed daily or weekly

### Advanced Analytics

- **Revenue Forecast** — Next-month revenue prediction using least-squares linear regression with R² confidence scoring and trend direction indicator
- **Customer Segmentation (RFM)** — Classifies customers into Champions, Loyal, At Risk, Lost, and New segments using adaptive median thresholds on Recency, Frequency, and Monetary value
- **Inventory Alerts** — Flags products by sales velocity (Low Stock Risk / Fast Moving / Stable / Declining) using month-over-month acceleration against a 75th-percentile threshold
- **Cohort Retention Heatmap** — Monthly retention grid showing what % of each acquisition cohort returns in subsequent months

### AI Insights

- 5 actionable business insights generated via Gemini API
- Proxied server-side to keep the API key secure
- Graceful error state if the API is unavailable — charts always render regardless

---

## Tech Stack

| Layer       | Technology              |
| ----------- | ----------------------- |
| Framework   | Next.js 14 (App Router) |
| Language    | TypeScript              |
| Styling     | Tailwind CSS            |
| Charts      | Recharts                |
| CSV Parsing | Papaparse               |
| AI Insights | Google Gemini API       |
| Deployment  | Vercel                  |

**Zero database. Zero login. All CSV parsing and analytics run entirely in the browser.**

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/app/apikey) API key (free tier)

### Installation

```bash
git clone https://github.com/your-username/shopify-dashboard.git
cd shopify-dashboard
npm install
```

### Environment Setup

Create a `.env.local` file in the root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** If you are in a region where Gemini free tier returns `limit: 0` errors, enable billing on your Google Cloud project. You will not be charged — billing just unlocks access in restricted regions.

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Usage

1. Export your orders from Shopify: **Admin → Orders → Export → All orders (CSV)**
2. Drag-and-drop (or click to upload) the CSV file
3. All charts render instantly in the browser — no data leaves your machine except the AI insights call
4. Click **New Upload** in the header to analyse a different store

### Sample Data

A `sample-orders.csv` is included with 108 realistic orders across Jan–Dec 2024, including repeat customers, multi-item orders, and 10+ countries. Use it to explore all features without a real Shopify export.

---

## Project Structure

```
app/
  page.tsx                    # Main state machine (upload → parse → dashboard)
  layout.tsx
  api/insights/route.ts       # Gemini proxy — keeps API key server-side
components/
  ui/
    KPICard.tsx               # Single metric card
    KPIRow.tsx                # 4-column KPI header row
    UploadZone.tsx            # Drag-and-drop CSV upload
    InsightsPanel.tsx         # AI insights grid
    ErrorBanner.tsx
    LoadingSpinner.tsx
  charts/
    RevenueByMonthChart.tsx
    TopProductsChart.tsx
    RevenueByCountryChart.tsx
    OrdersOverTimeChart.tsx
    RevenueForecastChart.tsx  # Linear regression forecast
    RFMSegmentChart.tsx       # Customer segmentation donut + table
    InventoryAlertsTable.tsx  # Velocity-based stock alerts
    CohortHeatmapChart.tsx    # Retention heatmap grid
lib/
  parseShopifyCSV.ts          # CSV parser + all analytics computations
  types.ts                    # TypeScript interfaces
  formatters.ts               # Currency, date, number formatters
```

---

## Analytics Methodology

### Revenue Forecast

Ordinary least-squares linear regression on monthly revenue indexed by time. R² (0–100%) is shown as a confidence bar. Trend direction (↑ / ↓ / →) is derived from the slope relative to mean monthly revenue.

### RFM Segmentation

Computes Recency (days since last order), Frequency (order count), and Monetary (total spend) per customer. Thresholds are **adaptive** — calculated from the median of each dimension within the uploaded dataset. Segment priority (cascading if/else):

| Segment         | Rule                                         |
| --------------- | -------------------------------------------- |
| Lost            | Recency ≥ 3× median recency                  |
| At Risk         | Recency ≥ 2× median, frequency ≥ 2           |
| Champions       | Low recency + high frequency + high monetary |
| Loyal Customers | High frequency + high monetary               |
| New Customers   | Single purchase                              |

### Inventory Velocity

Compares average units/month over the last 3 months against the prior 2 months. Products above the 75th-percentile velocity threshold are **Fast Moving**; those also accelerating (MoM ≥ +10%) are escalated to **Low Stock Risk**.

### Cohort Retention

Groups customers by first-purchase month. For each subsequent month, calculates what % of that cohort placed any order. Capped at the 12 most recent cohorts for readability. M0 (acquisition month) is always 100% by definition.

---

## Deployment

```bash
vercel --prod
```

Add `GEMINI_API_KEY` in **Vercel → Project → Settings → Environment Variables** before deploying.

---

