import Papa from "papaparse";
import type {
  ShopifyCSVRow,
  ShopifyMetrics,
  OrdersTimePoint,
  RevenueForecast,
  ForecastDataPoint,
  RFMAnalysis,
  RFMSegment,
  RFMSegmentStat,
  CustomerRFM,
  InventoryAlerts,
  ProductVelocity,
  InventoryStatus,
  CohortAnalysis,
  CohortRow,
} from "./types";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(raw: string): Date | null {
  if (!raw || raw.trim() === "") return null;
  const normalized = raw.trim().replace(" UTC", "Z").replace(" ", "T");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function getYearMonth(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function getDateString(d: Date): string {
  return d.toISOString().substring(0, 10);
}

function getWeekString(d: Date): string {
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
  );
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function truncateName(str: string, maxLen: number): string {
  if (!str) return "(Unknown Product)";
  return str.length <= maxLen ? str : str.substring(0, maxLen - 1) + "…";
}

/** Increment a "YYYY-MM" string by one calendar month */
function nextMonth(yyyyMm: string): string {
  const [y, m] = yyyyMm.split("-").map(Number);
  // m is 1-based; JS Date months are 0-based, so new Date(y, m) = first of next month
  const d = new Date(y, m, 1);
  return getYearMonth(d);
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseShopifyCSV(file: File): Promise<ShopifyMetrics> {
  return new Promise((resolve, reject) => {
    Papa.parse<ShopifyCSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete(results) {
        try {
          resolve(computeMetrics(results.data));
        } catch (err) {
          reject(err);
        }
      },
      error(err) {
        reject(new Error(`CSV parse failed: ${err.message}`));
      },
    });
  });
}

function computeMetrics(rows: ShopifyCSVRow[]): ShopifyMetrics {
  // Step 1 — Validate Shopify columns
  if (rows.length === 0 || !("Name" in rows[0])) {
    throw new Error("NO_SHOPIFY_COLUMNS");
  }

  // Step 2 — Order map: first-row-wins per order ID (includes email now)
  const orderMap = new Map<
    string,
    { total: number; date: Date; country: string; email: string }
  >();

  // Step 3 — Product maps
  const productMap = new Map<string, { revenue: number; quantity: number }>();
  // productMonthMap: product name → month key → units sold that month
  const productMonthMap = new Map<string, Map<string, number>>();

  for (const row of rows) {
    const orderId = (row["Name"] ?? "").trim();
    const paidAt = row["Paid at"] ?? "";
    const totalRaw = (row["Total"] ?? "").replace(/[,$]/g, "").trim();
    const country = (row["Billing Country"] ?? "").trim() || "(Unknown)";
    const email = (row["Email"] ?? "").trim().toLowerCase();

    // Product accumulation — runs on every row (line items don't double-count orders)
    const lineItemName = truncateName((row["Lineitem name"] ?? "").trim(), 30);
    const lineQty = parseInt(row["Lineitem quantity"] ?? "0", 10) || 0;
    const linePrice =
      parseFloat((row["Lineitem price"] ?? "0").replace(/[,$]/g, "")) || 0;

    if (lineItemName && lineItemName !== "(Unknown Product)") {
      const prev = productMap.get(lineItemName) ?? { revenue: 0, quantity: 0 };
      productMap.set(lineItemName, {
        revenue: prev.revenue + linePrice * lineQty,
        quantity: prev.quantity + lineQty,
      });

      // Track units per month per product (for inventory velocity)
      const rowDate = parseDate(paidAt);
      if (rowDate && lineQty > 0) {
        const ym = getYearMonth(rowDate);
        if (!productMonthMap.has(lineItemName)) {
          productMonthMap.set(lineItemName, new Map());
        }
        const monthlyUnits = productMonthMap.get(lineItemName)!;
        monthlyUnits.set(ym, (monthlyUnits.get(ym) ?? 0) + lineQty);
      }
    }

    // Order map: skip duplicates, rows with no date, or zero totals
    if (!orderId || orderMap.has(orderId)) continue;
    const date = parseDate(paidAt);
    if (!date) continue;
    const total = parseFloat(totalRaw);
    if (!total || total <= 0) continue;

    orderMap.set(orderId, { total, date, country, email });
  }

  if (orderMap.size === 0) {
    throw new Error("NO_PAID_ORDERS");
  }

  // Step 4 — KPIs
  let totalRevenue = 0;
  const dates: Date[] = [];

  for (const { total, date } of orderMap.values()) {
    totalRevenue += total;
    dates.push(date);
  }

  const totalOrders = orderMap.size;
  const averageOrderValue = totalRevenue / totalOrders;

  dates.sort((a, b) => a.getTime() - b.getTime());
  const dateRangeStart = getDateString(dates[0]);
  const dateRangeEnd = getDateString(dates[dates.length - 1]);

  // Step 5 — Revenue by month
  const monthMap = new Map<string, number>();
  for (const { total, date } of orderMap.values()) {
    const key = getYearMonth(date);
    monthMap.set(key, (monthMap.get(key) ?? 0) + total);
  }
  const revenueByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, revenue]) => ({ month, revenue }));

  const bestMonth = revenueByMonth.reduce(
    (best, cur) => (cur.revenue > best.revenue ? cur : best),
    revenueByMonth[0],
  ).month;

  // Step 5b — Revenue forecast (least-squares linear regression)
  const revenueForecast = computeForecast(revenueByMonth);

  // Step 6 — Top products
  const allProducts = Array.from(productMap.entries()).map(
    ([name, { revenue, quantity }]) => ({ name, revenue, quantity }),
  );
  const topProductsByRevenue = [...allProducts]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);
  const topProductsByQuantity = [...allProducts]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // Step 7 — Revenue by country (top 10)
  const countryMap = new Map<string, number>();
  for (const { total, country } of orderMap.values()) {
    countryMap.set(country, (countryMap.get(country) ?? 0) + total);
  }
  const revenueByCountry = Array.from(countryMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([country, revenue]) => ({ country, revenue }));

  // Step 8 — Orders over time
  const dayMap = new Map<string, number>();
  for (const { date } of orderMap.values()) {
    const key = getDateString(date);
    dayMap.set(key, (dayMap.get(key) ?? 0) + 1);
  }

  let ordersOverTime: OrdersTimePoint[];
  if (dayMap.size > 90) {
    const weekMap = new Map<string, number>();
    for (const { date } of orderMap.values()) {
      const key = getWeekString(date);
      weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
    }
    ordersOverTime = Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({ date, orders }));
  } else {
    ordersOverTime = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, orders]) => ({ date, orders }));
  }

  // Step 9 — Build customer map (shared by RFM + Cohort)
  const customerMap = new Map<
    string,
    {
      orders: { date: Date; total: number }[];
      lastDate: Date;
      totalSpend: number;
    }
  >();
  const customerOrderMonths = new Map<string, Set<string>>();

  for (const { total, date, email } of orderMap.values()) {
    if (!email) continue;
    if (!customerMap.has(email)) {
      customerMap.set(email, { orders: [], lastDate: date, totalSpend: 0 });
      customerOrderMonths.set(email, new Set());
    }
    const cust = customerMap.get(email)!;
    cust.orders.push({ date, total });
    cust.totalSpend += total;
    if (date > cust.lastDate) cust.lastDate = date;
    customerOrderMonths.get(email)!.add(getYearMonth(date));
  }

  // Step 9b — RFM analysis
  const rfmAnalysis = computeRFM(customerMap, dates[dates.length - 1]);

  // Step 10 — Inventory alerts
  const sortedMonths = revenueByMonth.map((m) => m.month);
  const inventoryAlerts = computeInventoryAlerts(
    productMap,
    productMonthMap,
    sortedMonths,
  );

  // Step 11 — Cohort retention
  const cohortAnalysis = computeCohortAnalysis(
    customerMap,
    customerOrderMonths,
    sortedMonths,
  );

  return {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    bestMonth,
    dateRangeStart,
    dateRangeEnd,
    revenueByMonth,
    topProductsByRevenue,
    topProductsByQuantity,
    revenueByCountry,
    ordersOverTime,
    revenueForecast,
    rfmAnalysis,
    inventoryAlerts,
    cohortAnalysis,
  };
}

// ── Feature computation functions ─────────────────────────────────────────────

function computeForecast(
  revenueByMonth: { month: string; revenue: number }[],
): RevenueForecast {
  const n = revenueByMonth.length;

  // Fallback for insufficient data
  if (n < 2) {
    const rev = n === 1 ? revenueByMonth[0].revenue : 0;
    const mon = n === 1 ? revenueByMonth[0].month : "";
    const fMon = n === 1 ? nextMonth(mon) : "";
    return {
      forecastMonth: fMon,
      forecastRevenue: rev,
      trend: "flat",
      confidence: "low",
      rSquared: 0,
      chartData:
        n === 1
          ? [
              { month: mon, revenue: rev },
              { month: fMon, forecast: rev },
            ]
          : [],
    };
  }

  // Least-squares linear regression: y = slope * x + intercept
  const y = revenueByMonth.map((m) => m.revenue);
  const xMean = (n - 1) / 2;
  const yMean = y.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (y[i] - yMean);
    den += (i - xMean) ** 2;
  }
  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  // Predict index n (the next month)
  const forecastRevenue = Math.max(0, slope * n + intercept);

  // R-squared (coefficient of determination)
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yHat = slope * i + intercept;
    ssTot += (y[i] - yMean) ** 2;
    ssRes += (y[i] - yHat) ** 2;
  }
  const rSquared = ssTot > 0 ? Math.max(0, 1 - ssRes / ssTot) : 1;

  const threshold = yMean * 0.02;
  const trend: RevenueForecast["trend"] =
    slope > threshold ? "up" : slope < -threshold ? "down" : "flat";
  const confidence: RevenueForecast["confidence"] =
    rSquared >= 0.8 ? "high" : rSquared >= 0.5 ? "medium" : "low";

  const forecastMonth = nextMonth(revenueByMonth[n - 1].month);
  const chartData: ForecastDataPoint[] = [
    ...revenueByMonth.map((m) => ({ month: m.month, revenue: m.revenue })),
    { month: forecastMonth, forecast: forecastRevenue },
  ];

  return {
    forecastMonth,
    forecastRevenue,
    trend,
    confidence,
    rSquared,
    chartData,
  };
}

function computeRFM(
  customerMap: Map<
    string,
    {
      orders: { date: Date; total: number }[];
      lastDate: Date;
      totalSpend: number;
    }
  >,
  referenceDate: Date,
): RFMAnalysis {
  if (customerMap.size === 0) {
    return { segments: [], topCustomers: [], totalCustomers: 0 };
  }

  const segmentColors: Record<RFMSegment, string> = {
    Champions: "#6366f1",
    "Loyal Customers": "#10b981",
    "At Risk": "#f59e0b",
    Lost: "#ef4444",
    "New Customers": "#a855f7",
  };

  const rawRFM = Array.from(customerMap.entries()).map(
    ([email, { orders, lastDate, totalSpend }]) => ({
      email,
      recencyDays: Math.floor(
        (referenceDate.getTime() - lastDate.getTime()) / 86400000,
      ),
      frequency: orders.length,
      monetary: totalSpend,
    }),
  );

  // Adaptive thresholds from data medians
  const medianRecency = Math.max(median(rawRFM.map((r) => r.recencyDays)), 1);
  const medianFrequency = Math.max(median(rawRFM.map((r) => r.frequency)), 2);
  const medianMonetary = Math.max(median(rawRFM.map((r) => r.monetary)), 0);

  // Cascading segment rules (priority order matters)
  const customers: CustomerRFM[] = rawRFM.map(
    ({ email, recencyDays, frequency, monetary }) => {
      let segment: RFMSegment;
      if (recencyDays >= medianRecency * 3) {
        segment = "Lost";
      } else if (recencyDays >= medianRecency * 2 && frequency >= 2) {
        segment = "At Risk";
      } else if (
        recencyDays < medianRecency &&
        frequency >= medianFrequency &&
        monetary >= medianMonetary
      ) {
        segment = "Champions";
      } else if (frequency >= medianFrequency && monetary >= medianMonetary) {
        segment = "Loyal Customers";
      } else if (frequency === 1) {
        segment = "New Customers";
      } else {
        segment = "Loyal Customers";
      }
      return { email, recencyDays, frequency, monetary, segment };
    },
  );

  const allSegments: RFMSegment[] = [
    "Champions",
    "Loyal Customers",
    "At Risk",
    "Lost",
    "New Customers",
  ];

  const statsMap = new Map<RFMSegment, { count: number; totalRevenue: number }>(
    allSegments.map((s) => [s, { count: 0, totalRevenue: 0 }]),
  );
  for (const c of customers) {
    const stat = statsMap.get(c.segment)!;
    stat.count++;
    stat.totalRevenue += c.monetary;
  }

  const totalCustomers = customers.length;
  const segments: RFMSegmentStat[] = allSegments
    .map((segment) => {
      const stat = statsMap.get(segment)!;
      return {
        segment,
        count: stat.count,
        percentage:
          totalCustomers > 0
            ? Math.round((stat.count / totalCustomers) * 100)
            : 0,
        avgRevenue: stat.count > 0 ? stat.totalRevenue / stat.count : 0,
        color: segmentColors[segment],
      };
    })
    .filter((s) => s.count > 0);

  const topCustomers = [...customers]
    .sort((a, b) => b.monetary - a.monetary)
    .slice(0, 10);

  return { segments, topCustomers, totalCustomers };
}

function computeInventoryAlerts(
  productMap: Map<string, { revenue: number; quantity: number }>,
  productMonthMap: Map<string, Map<string, number>>,
  sortedMonths: string[],
): InventoryAlerts {
  const last3Months = sortedMonths.slice(-3);
  const prior2Months = sortedMonths.slice(-5, -3);
  const analysisMonth = sortedMonths[sortedMonths.length - 1] ?? "";

  // Collect velocities in two passes: first to compute p75 threshold
  const velocities: number[] = [];
  const rawProducts: Array<{
    name: string;
    totalUnits: number;
    velocityLast3: number;
    velocityPrior2: number;
  }> = [];

  for (const [name, { quantity }] of productMap.entries()) {
    const monthlyUnits = productMonthMap.get(name) ?? new Map<string, number>();
    const last3Total = last3Months.reduce(
      (s, m) => s + (monthlyUnits.get(m) ?? 0),
      0,
    );
    const prior2Total = prior2Months.reduce(
      (s, m) => s + (monthlyUnits.get(m) ?? 0),
      0,
    );
    const velocityLast3 =
      last3Months.length > 0 ? last3Total / last3Months.length : 0;
    const velocityPrior2 =
      prior2Months.length > 0 ? prior2Total / prior2Months.length : 0;
    velocities.push(velocityLast3);
    rawProducts.push({
      name,
      totalUnits: quantity,
      velocityLast3,
      velocityPrior2,
    });
  }

  // 75th percentile velocity threshold for "high velocity" classification
  const sortedVelocities = [...velocities].sort((a, b) => a - b);
  const p75Idx = Math.floor(0.75 * sortedVelocities.length);
  const p75velocity = sortedVelocities[p75Idx] ?? 0;

  const statusOrder: InventoryStatus[] = [
    "Low Stock Risk",
    "Fast Moving",
    "Stable",
    "Declining",
  ];

  const products: ProductVelocity[] = rawProducts
    .map(({ name, totalUnits, velocityLast3, velocityPrior2 }) => {
      const accelerationPct =
        velocityPrior2 > 0
          ? ((velocityLast3 - velocityPrior2) / velocityPrior2) * 100
          : velocityLast3 > 0
            ? 100
            : 0;

      let status: InventoryStatus;
      if (
        velocityLast3 > 0 &&
        velocityLast3 >= p75velocity &&
        accelerationPct >= 10
      ) {
        status = "Low Stock Risk";
      } else if (
        velocityLast3 > 0 &&
        velocityLast3 >= p75velocity &&
        accelerationPct >= -10
      ) {
        status = "Fast Moving";
      } else if (accelerationPct <= -30 && velocityLast3 > 0) {
        status = "Declining";
      } else {
        status = "Stable";
      }

      return {
        name,
        totalUnits,
        last30DayVelocity: Math.round(velocityLast3 * 10) / 10,
        accelerationPct: Math.round(accelerationPct * 10) / 10,
        status,
      };
    })
    .sort(
      (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status),
    );

  return { products, analysisMonth };
}

function computeCohortAnalysis(
  customerMap: Map<
    string,
    {
      orders: { date: Date; total: number }[];
      lastDate: Date;
      totalSpend: number;
    }
  >,
  customerOrderMonths: Map<string, Set<string>>,
  allMonths: string[],
): CohortAnalysis {
  if (customerMap.size === 0 || allMonths.length < 2) {
    return { rows: [], maxOffset: 0 };
  }

  // Determine each customer's first purchase month
  const firstPurchaseMonth = new Map<string, string>();
  for (const [email, { orders }] of customerMap.entries()) {
    const sorted = [...orders].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
    firstPurchaseMonth.set(email, getYearMonth(sorted[0].date));
  }

  // Group customers into cohorts by first-purchase month
  const cohortGroups = new Map<string, string[]>();
  for (const [email, month] of firstPurchaseMonth.entries()) {
    if (!cohortGroups.has(month)) cohortGroups.set(month, []);
    cohortGroups.get(month)!.push(email);
  }

  // For each cohort, calculate retention at each month offset
  const cohortRows: CohortRow[] = [];
  for (const cohortMonth of allMonths) {
    const members = cohortGroups.get(cohortMonth);
    if (!members || members.length === 0) continue;

    const startIndex = allMonths.indexOf(cohortMonth);
    const retentionByOffset: number[] = [];

    for (
      let offset = 0;
      offset <= allMonths.length - startIndex - 1;
      offset++
    ) {
      const targetMonth = allMonths[startIndex + offset];
      const retained = members.filter(
        (email) => customerOrderMonths.get(email)?.has(targetMonth) ?? false,
      ).length;
      retentionByOffset.push(Math.round((retained / members.length) * 100));
    }

    cohortRows.push({
      cohortMonth,
      cohortSize: members.length,
      retentionByOffset,
    });
  }

  // Limit to 12 most recent cohorts to keep heatmap readable
  const trimmedRows = cohortRows.slice(-12);
  const maxOffset =
    trimmedRows.length > 0
      ? Math.max(...trimmedRows.map((r) => r.retentionByOffset.length - 1))
      : 0;

  return { rows: trimmedRows, maxOffset };
}
