// ── Raw CSV row from Papaparse ──────────────────────────────────────────────
export interface ShopifyCSVRow {
  Name: string; // "#1001" — order ID
  "Paid at": string; // ISO-ish date string
  Total: string; // "149.99" — order total (only trust on first line item row)
  "Lineitem name": string;
  "Lineitem quantity": string;
  "Lineitem price": string;
  "Billing Country": string;
  [key: string]: string; // index signature for Papaparse compatibility
}

// ── Computed metrics ─────────────────────────────────────────────────────────
export interface ShopifyMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bestMonth: string; // "2024-03"
  dateRangeStart: string; // "2024-01-01"
  dateRangeEnd: string; // "2024-12-31"

  revenueByMonth: MonthRevenue[];
  topProductsByRevenue: ProductMetric[];
  topProductsByQuantity: ProductMetric[];
  revenueByCountry: CountryRevenue[];
  ordersOverTime: OrdersTimePoint[];

  revenueForecast: RevenueForecast;
  rfmAnalysis: RFMAnalysis;
  inventoryAlerts: InventoryAlerts;
  cohortAnalysis: CohortAnalysis;
}

export interface MonthRevenue {
  month: string; // "2024-03"
  revenue: number;
}

export interface ProductMetric {
  name: string;
  revenue: number;
  quantity: number;
}

export interface CountryRevenue {
  country: string;
  revenue: number;
}

export interface OrdersTimePoint {
  date: string; // "2024-03-15" or "2024-W11"
  orders: number;
}

// ── AI Insights ──────────────────────────────────────────────────────────────
export type InsightType = "opportunity" | "warning" | "positive" | "suggestion";

export interface InsightItem {
  title: string;
  body: string;
  type: InsightType;
}

export interface InsightsResponse {
  insights: InsightItem[];
}

// ── API request payload ───────────────────────────────────────────────────────
export interface InsightsRequestPayload {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  bestMonth: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  topProductsByRevenue: ProductMetric[];
  topProductsByQuantity: ProductMetric[];
  revenueByCountry: CountryRevenue[];
  revenueByMonth: MonthRevenue[];
}

// ── App state ─────────────────────────────────────────────────────────────────
export type AppState = "upload" | "parsing" | "dashboard";
export type InsightsState = "idle" | "loading" | "success" | "error";

// ── Feature 1: Revenue Forecasting ───────────────────────────────────────────
export interface ForecastDataPoint {
  month: string;
  revenue?: number;
  forecast?: number;
}

export interface RevenueForecast {
  forecastMonth: string;
  forecastRevenue: number;
  trend: "up" | "down" | "flat";
  confidence: "high" | "medium" | "low";
  rSquared: number;
  chartData: ForecastDataPoint[];
}

// ── Feature 2: RFM Customer Segmentation ─────────────────────────────────────
export type RFMSegment =
  | "Champions"
  | "Loyal Customers"
  | "At Risk"
  | "Lost"
  | "New Customers";

export interface RFMSegmentStat {
  segment: RFMSegment;
  count: number;
  percentage: number;
  avgRevenue: number;
  color: string;
}

export interface CustomerRFM {
  email: string;
  recencyDays: number;
  frequency: number;
  monetary: number;
  segment: RFMSegment;
}

export interface RFMAnalysis {
  segments: RFMSegmentStat[];
  topCustomers: CustomerRFM[];
  totalCustomers: number;
}

// ── Feature 3: Inventory Alerts ───────────────────────────────────────────────
export type InventoryStatus =
  | "Low Stock Risk"
  | "Fast Moving"
  | "Stable"
  | "Declining";

export interface ProductVelocity {
  name: string;
  totalUnits: number;
  last30DayVelocity: number;
  accelerationPct: number;
  status: InventoryStatus;
}

export interface InventoryAlerts {
  products: ProductVelocity[];
  analysisMonth: string;
}

// ── Feature 4: Cohort Retention Analysis ──────────────────────────────────────
export interface CohortRow {
  cohortMonth: string;
  cohortSize: number;
  retentionByOffset: number[];
}

export interface CohortAnalysis {
  rows: CohortRow[];
  maxOffset: number;
}
