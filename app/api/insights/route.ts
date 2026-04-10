import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { InsightsRequestPayload, InsightsResponse } from "@/lib/types";

function buildPrompt(payload: InsightsRequestPayload): string {
  const {
    totalRevenue,
    totalOrders,
    averageOrderValue,
    bestMonth,
    dateRangeStart,
    dateRangeEnd,
    topProductsByRevenue,
    topProductsByQuantity,
    revenueByCountry,
    revenueByMonth,
  } = payload;

  const topRevenueList = topProductsByRevenue
    .map((p, i) => `${i + 1}. ${p.name}: $${p.revenue.toFixed(2)}`)
    .join("\n");

  const topQtyList = topProductsByQuantity
    .map((p, i) => `${i + 1}. ${p.name}: ${p.quantity} units`)
    .join("\n");

  const countryList = revenueByCountry
    .map((c, i) => `${i + 1}. ${c.country}: $${c.revenue.toFixed(2)}`)
    .join("\n");

  const last6Months = revenueByMonth
    .slice(-6)
    .map((m) => `${m.month}: $${m.revenue.toFixed(2)}`)
    .join("\n");

  const topProductRevShare =
    topProductsByRevenue.length > 0
      ? ((topProductsByRevenue[0].revenue / totalRevenue) * 100).toFixed(1)
      : "0";

  return `You are an expert e-commerce analyst. Analyze this Shopify store data and return exactly 5 actionable business insights in JSON.

STORE DATA SUMMARY:
- Date range: ${dateRangeStart} to ${dateRangeEnd}
- Total revenue: $${totalRevenue.toFixed(2)}
- Total orders: ${totalOrders}
- Average order value: $${averageOrderValue.toFixed(2)}
- Best revenue month: ${bestMonth}
- Top product revenue share: ${topProductRevShare}%

TOP 5 PRODUCTS BY REVENUE:
${topRevenueList}

TOP 5 PRODUCTS BY QUANTITY SOLD:
${topQtyList}

TOP MARKETS BY REVENUE:
${countryList}

MONTHLY REVENUE TREND (last 6 months):
${last6Months}

Return a JSON object matching this EXACT schema. Output raw JSON only — no markdown, no code fences, no explanation:
{
  "insights": [
    {
      "title": "Short title (max 8 words)",
      "body": "2-3 sentence actionable recommendation with specific numbers from the data.",
      "type": "opportunity" | "warning" | "positive" | "suggestion"
    }
  ]
}

Rules:
- Exactly 5 insights total
- Include at least one "positive", one "opportunity", one "warning"
- Every insight MUST reference specific numbers from the data above
- Focus on actionable recommendations, not just observations
- Do not repeat the same point twice`;
}

export async function POST(req: NextRequest) {
  try {
    const payload: InsightsRequestPayload = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = buildPrompt(payload);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Strip accidental markdown code fences Gemini sometimes adds
    const cleaned = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();

    const parsed: InsightsResponse = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[insights] error:", msg);
    return NextResponse.json(
      { error: "Failed to generate insights", detail: msg },
      { status: 500 },
    );
  }
}
