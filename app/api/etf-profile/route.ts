import { NextResponse } from "next/server"

// GET /api/etf-profile?ticker=VFV.TO
// Returns real sector breakdown from Yahoo Finance for any ETF
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param" }, { status: 400 })
  }

  try {
    // Yahoo Finance quoteSummary with topHoldings and fundProfile modules
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=topHoldings,fundProfile,price,summaryDetail,defaultKeyStatistics`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 3600 }, // cache for 1 hour
    })

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch ETF data" }, { status: 502 })
    }

    const data = await res.json()
    const result = data?.quoteSummary?.result?.[0]
    if (!result) {
      return NextResponse.json({ error: "No data found" }, { status: 404 })
    }

    const topHoldings = result.topHoldings || {}
    const fundProfile = result.fundProfile || {}
    const price = result.price || {}
    const summaryDetail = result.summaryDetail || {}
    const keyStats = result.defaultKeyStatistics || {}

    // Sector weights from topHoldings
    const sectorWeightings = topHoldings.sectorWeightings || []
    const sectors: Record<string, number> = {}
    for (const sectorObj of sectorWeightings) {
      // Each sectorObj is like { "realestate": { raw: 0.02 } }
      for (const [key, val] of Object.entries(sectorObj)) {
        const pct = (val as { raw?: number })?.raw
        if (pct != null && pct > 0) {
          sectors[formatSectorName(key)] = Math.round(pct * 10000) / 100
        }
      }
    }

    // Top holdings
    const holdings = (topHoldings.holdings || []).slice(0, 15).map((h: Record<string, unknown>) => ({
      symbol: (h.symbol as string) || "",
      name: (h.holdingName as string) || "",
      percent: (h.holdingPercent as { raw?: number })?.raw
        ? Math.round(((h.holdingPercent as { raw: number }).raw) * 10000) / 100
        : 0,
    }))

    // Fund info
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

    return NextResponse.json({
      ticker,
      fund: fundInfo,
      sectors,
      topHoldings: holdings,
    })
  } catch (err) {
    console.error("ETF profile fetch error:", err)
    return NextResponse.json({ error: "Failed to fetch ETF profile" }, { status: 500 })
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
