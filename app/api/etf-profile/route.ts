import { NextResponse } from "next/server"

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

// GET /api/etf-profile?ticker=VFV.TO
// Returns sector breakdown + top holdings from Yahoo Finance for any ETF
// Tries v10/quoteSummary first, falls back to v7/quote for basic fund info
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param" }, { status: 400 })
  }

  // Try v10 quoteSummary first (has sector breakdown + top holdings)
  const v10Result = await fetchV10Profile(ticker)
  if (v10Result) return NextResponse.json(v10Result)

  // Fall back to v7 quote for basic fund info (no sector data)
  const v7Result = await fetchV7FundInfo(ticker)
  if (v7Result) return NextResponse.json(v7Result)

  return NextResponse.json({ error: "Failed to fetch ETF data" }, { status: 502 })
}

async function fetchV10Profile(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=topHoldings,fundProfile,price,summaryDetail,defaultKeyStatistics`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 3600 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const result = data?.quoteSummary?.result?.[0]
    if (!result) return null

    const topHoldings = result.topHoldings || {}
    const fundProfile = result.fundProfile || {}
    const price = result.price || {}
    const summaryDetail = result.summaryDetail || {}
    const keyStats = result.defaultKeyStatistics || {}

    // Sector weights
    const sectorWeightings = topHoldings.sectorWeightings || []
    const sectors: Record<string, number> = {}
    for (const sectorObj of sectorWeightings) {
      for (const [key, val] of Object.entries(sectorObj)) {
        const pct = (val as { raw?: number })?.raw
        if (pct != null && pct > 0) {
          sectors[formatSectorName(key)] = Math.round(pct * 10000) / 100
        }
      }
    }

    const holdings = (topHoldings.holdings || []).slice(0, 15).map((h: Record<string, unknown>) => ({
      symbol: (h.symbol as string) || "",
      name: (h.holdingName as string) || "",
      percent: (h.holdingPercent as { raw?: number })?.raw
        ? Math.round(((h.holdingPercent as { raw: number }).raw) * 10000) / 100
        : 0,
    }))

    const fundInfo = {
      name: price.shortName || price.longName || ticker,
      category: fundProfile.categoryName || "",
      family: fundProfile.family || "",
      legalType: fundProfile.legalType || "",
      exchange: price.exchangeName || "",
      currency: price.currency || "USD",
      price: price.regularMarketPrice?.raw || 0,
      change: price.regularMarketChange?.raw || 0,
      changePercent: price.regularMarketChangePercent?.raw
        ? price.regularMarketChangePercent.raw * 100
        : 0,
      expenseRatio: keyStats.annualReportExpenseRatio?.raw
        ? keyStats.annualReportExpenseRatio.raw * 100
        : fundProfile.feesExpensesInvestment?.annualReportExpenseRatio?.raw
          ? fundProfile.feesExpensesInvestment.annualReportExpenseRatio.raw * 100
          : null,
      totalAssets: summaryDetail.totalAssets?.raw || null,
      yield: summaryDetail.yield?.raw ? summaryDetail.yield.raw * 100 : null,
      ytdReturn: keyStats.ytdReturn?.raw ? keyStats.ytdReturn.raw * 100 : null,
      threeYearReturn: keyStats.threeYearAverageReturn?.raw
        ? keyStats.threeYearAverageReturn.raw * 100
        : null,
      fiveYearReturn: keyStats.fiveYearAverageReturn?.raw
        ? keyStats.fiveYearAverageReturn.raw * 100
        : null,
      beta: keyStats.beta3Year?.raw || null,
    }

    return { ticker, fund: fundInfo, sectors, topHoldings: holdings }
  } catch {
    return null
  }
}

async function fetchV7FundInfo(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null

    const data = await res.json()
    const q = data?.quoteResponse?.result?.[0]
    if (!q) return null

    return {
      ticker,
      fund: {
        name: q.shortName || q.longName || ticker,
        category: "",
        family: "",
        legalType: "",
        exchange: q.fullExchangeName || "",
        currency: q.currency || "USD",
        price: q.regularMarketPrice || 0,
        change: q.regularMarketChange || 0,
        changePercent: q.regularMarketChangePercent || 0,
        expenseRatio: null,
        totalAssets: null,
        yield: q.dividendYield ? q.dividendYield * 100 : null,
        ytdReturn: null,
        threeYearReturn: null,
        fiveYearReturn: null,
        beta: null,
      },
      sectors: {} as Record<string, number>,
      topHoldings: [],
    }
  } catch {
    return null
  }
}

function formatSectorName(key: string): string {
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
