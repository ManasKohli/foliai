import { NextResponse } from "next/server"

// GET /api/stock-detail?ticker=AAPL
// Returns detailed quote data + news for a single ticker
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param" }, { status: 400 })
  }

  const [quoteData, newsData] = await Promise.all([
    fetchQuoteDetail(ticker),
    fetchTickerNews(ticker),
  ])

  return NextResponse.json({ quote: quoteData, news: newsData })
}

async function fetchQuoteDetail(ticker: string) {
  try {
    // Use Yahoo Finance quoteSummary for rich data
    const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=price,summaryDetail,defaultKeyStatistics,calendarEvents`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    })

    if (!res.ok) {
      // Fallback to chart API for basic data
      return fetchBasicQuote(ticker)
    }

    const data = await res.json()
    const result = data?.quoteSummary?.result?.[0]
    if (!result) return fetchBasicQuote(ticker)

    const price = result.price || {}
    const summary = result.summaryDetail || {}
    const keyStats = result.defaultKeyStatistics || {}
    const calendar = result.calendarEvents || {}

    return {
      ticker,
      name: price.shortName || price.longName || ticker,
      price: price.regularMarketPrice?.raw || 0,
      change: price.regularMarketChange?.raw || 0,
      changePercent: price.regularMarketChangePercent?.raw ? price.regularMarketChangePercent.raw * 100 : 0,
      previousClose: price.regularMarketPreviousClose?.raw || 0,
      open: price.regularMarketOpen?.raw || 0,
      dayHigh: price.regularMarketDayHigh?.raw || 0,
      dayLow: price.regularMarketDayLow?.raw || 0,
      volume: price.regularMarketVolume?.raw || 0,
      avgVolume: summary.averageVolume?.raw || 0,
      marketCap: price.marketCap?.raw || 0,
      currency: price.currency || "USD",
      exchange: price.exchangeName || "",
      quoteType: price.quoteType || "EQUITY",

      // Valuation
      peRatio: summary.trailingPE?.raw || keyStats.trailingPE?.raw || null,
      forwardPE: summary.forwardPE?.raw || keyStats.forwardPE?.raw || null,
      pegRatio: keyStats.pegRatio?.raw || null,
      priceToBook: keyStats.priceToBook?.raw || null,

      // Dividends
      dividendYield: summary.dividendYield?.raw ? summary.dividendYield.raw * 100 : null,
      dividendRate: summary.dividendRate?.raw || null,
      exDividendDate: summary.exDividendDate?.fmt || null,
      payoutRatio: summary.payoutRatio?.raw ? summary.payoutRatio.raw * 100 : null,

      // Ranges
      fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh?.raw || null,
      fiftyTwoWeekLow: summary.fiftyTwoWeekLow?.raw || null,
      fiftyDayAverage: summary.fiftyDayAverage?.raw || null,
      twoHundredDayAverage: summary.twoHundredDayAverage?.raw || null,

      // Key stats
      beta: summary.beta?.raw || keyStats.beta?.raw || null,
      eps: keyStats.trailingEps?.raw || null,
      forwardEps: keyStats.forwardEps?.raw || null,
      profitMargin: keyStats.profitMargins?.raw ? keyStats.profitMargins.raw * 100 : null,

      // Earnings
      earningsDate: calendar.earnings?.earningsDate?.[0]?.fmt || null,
      earningsDateEnd: calendar.earnings?.earningsDate?.[1]?.fmt || null,
    }
  } catch {
    return fetchBasicQuote(ticker)
  }
}

async function fetchBasicQuote(ticker: string) {
  try {
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`
    const chartRes = await fetch(chartUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    })
    if (!chartRes.ok) return null
    const chartData = await chartRes.json()
    const meta = chartData?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price = meta.regularMarketPrice || 0
    const prevClose = meta.chartPreviousClose || meta.previousClose || price
    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      ticker,
      name: meta.shortName || ticker,
      price,
      change,
      changePercent,
      previousClose: prevClose,
      currency: meta.currency || "USD",
      exchange: meta.exchangeName || "",
      quoteType: meta.instrumentType || "EQUITY",
    }
  } catch {
    return null
  }
}

interface NewsArticle {
  title: string
  publisher: string
  link: string
  publishedAt: string
  thumbnail?: string
}

async function fetchTickerNews(ticker: string): Promise<NewsArticle[]> {
  try {
    // Yahoo Finance news search
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=8&quotesCount=0&enableFuzzyQuery=false`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []

    const data = await res.json()
    const news = data?.news || []

    return news.slice(0, 8).map((item: Record<string, unknown>) => ({
      title: item.title || "",
      publisher: item.publisher || "",
      link: item.link || "",
      publishedAt: item.providerPublishTime
        ? new Date((item.providerPublishTime as number) * 1000).toISOString()
        : "",
      thumbnail: (item.thumbnail as Record<string, unknown[]>)?.resolutions?.[0]
        ? ((item.thumbnail as Record<string, unknown[]>).resolutions[0] as Record<string, string>).url
        : undefined,
    }))
  } catch {
    return []
  }
}
