import { NextResponse } from "next/server"
import { fetchYahooFinance, buildChartPath, buildQuoteSummaryPath } from "@/lib/yahoo-finance"

interface V10Response {
  quoteSummary?: {
    result?: Array<{
      topHoldings?: {
        sectorWeightings?: Array<Record<string, { raw?: number }>>
        holdings?: Array<{
          symbol?: string
          holdingName?: string
          holdingPercent?: { raw?: number }
        }>
      }
      fundProfile?: {
        categoryName?: string
        family?: string
      }
      price?: {
        shortName?: string
        longName?: string
        exchangeName?: string
        currency?: string
        regularMarketPrice?: { raw?: number }
        regularMarketChange?: { raw?: number }
        regularMarketChangePercent?: { raw?: number }
      }
      summaryDetail?: {
        totalAssets?: { raw?: number }
        yield?: { raw?: number }
      }
      defaultKeyStatistics?: {
        annualReportExpenseRatio?: { raw?: number }
      }
    }>
  }
}

interface ChartResponse {
  chart?: {
    result?: Array<{
      meta: {
        regularMarketPrice?: number
        chartPreviousClose?: number
        previousClose?: number
        shortName?: string
        longName?: string
        exchangeName?: string
        currency?: string
      }
    }>
  }
}

// GET /api/etf-profile?ticker=VFV.TO
// Tries v10 quoteSummary for sector data, falls back to v8 chart for basics
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param" }, { status: 400 })
  }

  // Try v10 first for rich fund data (sectors + top holdings)
  const v10 = await fetchV10(ticker)
  if (v10) return NextResponse.json(v10)

  // Fall back to v8 chart meta for basic fund info
  const v8 = await fetchV8FundBasics(ticker)
  if (v8) return NextResponse.json(v8)

  return NextResponse.json({ error: "Failed to fetch ETF data" }, { status: 502 })
}

async function fetchV10(ticker: string) {
  const path = buildQuoteSummaryPath(ticker, [
    "topHoldings",
    "fundProfile",
    "price",
    "summaryDetail",
    "defaultKeyStatistics",
  ])
  const { data, error } = await fetchYahooFinance<V10Response>(path, {
    revalidate: 3600,
  })

  if (error) {
    console.error(`[ETFProfile] v10 fetch failed for ${ticker}: ${error}`)
    return null
  }

  const r = data?.quoteSummary?.result?.[0]
  if (!r) return null

  const topHoldings = r.topHoldings || {}
  const fundProfile = r.fundProfile || {}
  const price = r.price || {}
  const sd = r.summaryDetail || {}
  const ks = r.defaultKeyStatistics || {}

  const sectorWeightings = topHoldings.sectorWeightings || []
  const sectors: Record<string, number> = {}
  for (const sectorObj of sectorWeightings) {
    for (const [key, val] of Object.entries(sectorObj)) {
      const pct = val?.raw
      if (pct != null && pct > 0) {
        sectors[formatSector(key)] = Math.round(pct * 10000) / 100
      }
    }
  }

  const holdings = (topHoldings.holdings || []).slice(0, 15).map((h) => ({
    symbol: h.symbol || "",
    name: h.holdingName || "",
    percent: h.holdingPercent?.raw
      ? Math.round(h.holdingPercent.raw * 10000) / 100
      : 0,
  }))

  return {
    ticker,
    fund: {
      name: price.shortName || price.longName || ticker,
      category: fundProfile.categoryName || "",
      family: fundProfile.family || "",
      exchange: price.exchangeName || "",
      currency: price.currency || "USD",
      price: price.regularMarketPrice?.raw || 0,
      change: price.regularMarketChange?.raw || 0,
      changePercent: price.regularMarketChangePercent?.raw
        ? price.regularMarketChangePercent.raw * 100
        : 0,
      expenseRatio: ks.annualReportExpenseRatio?.raw
        ? ks.annualReportExpenseRatio.raw * 100
        : null,
      totalAssets: sd.totalAssets?.raw || null,
      yield: sd.yield?.raw ? sd.yield.raw * 100 : null,
    },
    sectors,
    topHoldings: holdings,
  }
}

async function fetchV8FundBasics(ticker: string) {
  const path = buildChartPath(ticker, "5d", "1d")
  const { data, error } = await fetchYahooFinance<ChartResponse>(path, {
    revalidate: 300,
  })

  if (error) {
    console.error(`[ETFProfile] v8 fetch failed for ${ticker}: ${error}`)
    return null
  }

  const meta = data?.chart?.result?.[0]?.meta
  if (!meta) return null

  const price = meta.regularMarketPrice || 0
  const prevClose = meta.chartPreviousClose || meta.previousClose || price

  return {
    ticker,
    fund: {
      name: meta.shortName || meta.longName || ticker,
      category: "",
      family: "",
      exchange: meta.exchangeName || "",
      currency: meta.currency || "USD",
      price,
      change: price - prevClose,
      changePercent: prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0,
      expenseRatio: null,
      totalAssets: null,
      yield: null,
    },
    sectors: {} as Record<string, number>,
    topHoldings: [],
  }
}

function formatSector(key: string): string {
  const map: Record<string, string> = {
    realestate: "Real Estate",
    consumer_cyclical: "Consumer Discretionary",
    basic_materials: "Materials",
    consumer_defensive: "Consumer Staples",
    technology: "Technology",
    communication_services: "Communication",
    financial_services: "Financials",
    utilities: "Utilities",
    industrials: "Industrials",
    healthcare: "Healthcare",
    energy: "Energy",
  }
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")
}
