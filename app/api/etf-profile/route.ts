import { NextResponse } from "next/server"

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

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
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=topHoldings,fundProfile,price,summaryDetail,defaultKeyStatistics`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 3600 },
    })
    if (!res.ok) return null

    const data = await res.json()
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
        const pct = (val as { raw?: number })?.raw
        if (pct != null && pct > 0) {
          sectors[formatSector(key)] = Math.round(pct * 10000) / 100
        }
      }
    }

    const holdings = (topHoldings.holdings || [])
      .slice(0, 15)
      .map((h: Record<string, unknown>) => ({
        symbol: (h.symbol as string) || "",
        name: (h.holdingName as string) || "",
        percent: (h.holdingPercent as { raw?: number })?.raw
          ? Math.round((h.holdingPercent as { raw: number }).raw * 10000) / 100
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
  } catch {
    return null
  }
}

async function fetchV8FundBasics(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null

    const data = await res.json()
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
  } catch {
    return null
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
