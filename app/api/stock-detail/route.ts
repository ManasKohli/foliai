import { NextResponse } from "next/server"

// GET /api/stock-detail?ticker=AAPL
// Returns detailed quote data + news for a single ticker
// Uses multiple Yahoo Finance endpoints with fallbacks
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

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

async function fetchQuoteDetail(ticker: string) {
  // Strategy: try v7/finance/quote first (richest data that actually works),
  // then fall back to v8/finance/chart for basics
  const quoteResult = await fetchFromQuoteAPI(ticker)
  if (quoteResult) return quoteResult
  return fetchFromChartAPI(ticker)
}

async function fetchFromQuoteAPI(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(ticker)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,averageDailyVolume3Month,marketCap,shortName,longName,currency,fullExchangeName,quoteType,trailingPE,forwardPE,pegRatio,priceToBook,dividendYield,trailingAnnualDividendRate,exDividendDate,payoutRatio,fiftyTwoWeekHigh,fiftyTwoWeekLow,fiftyDayAverage,twoHundredDayAverage,beta,epsTrailingTwelveMonths,epsForward,profitMargins,earningsTimestamp,earningsTimestampStart,earningsTimestampEnd,bookValue,priceToSales`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 120 },
    })

    if (!res.ok) return null

    const data = await res.json()
    const q = data?.quoteResponse?.result?.[0]
    if (!q || !q.regularMarketPrice) return null

    // Parse earnings dates from timestamps
    let earningsDate: string | null = null
    let earningsDateEnd: string | null = null
    if (q.earningsTimestampStart) {
      earningsDate = new Date(q.earningsTimestampStart * 1000).toISOString().split("T")[0]
    } else if (q.earningsTimestamp) {
      earningsDate = new Date(q.earningsTimestamp * 1000).toISOString().split("T")[0]
    }
    if (q.earningsTimestampEnd) {
      earningsDateEnd = new Date(q.earningsTimestampEnd * 1000).toISOString().split("T")[0]
    }

    return {
      ticker,
      name: q.shortName || q.longName || ticker,
      price: q.regularMarketPrice || 0,
      change: q.regularMarketChange || 0,
      changePercent: q.regularMarketChangePercent || 0,
      previousClose: q.regularMarketPreviousClose || 0,
      open: q.regularMarketOpen || null,
      dayHigh: q.regularMarketDayHigh || null,
      dayLow: q.regularMarketDayLow || null,
      volume: q.regularMarketVolume || null,
      avgVolume: q.averageDailyVolume3Month || null,
      marketCap: q.marketCap || null,
      currency: q.currency || "USD",
      exchange: q.fullExchangeName || "",
      quoteType: q.quoteType || "EQUITY",

      // Valuation
      peRatio: q.trailingPE ?? null,
      forwardPE: q.forwardPE ?? null,
      pegRatio: q.pegRatio ?? null,
      priceToBook: q.priceToBook ?? null,
      priceToSales: q.priceToSales ?? null,
      bookValue: q.bookValue ?? null,

      // Dividends
      dividendYield: q.dividendYield ? q.dividendYield * 100 : null,
      dividendRate: q.trailingAnnualDividendRate ?? null,
      exDividendDate: q.exDividendDate
        ? new Date(q.exDividendDate * 1000).toISOString().split("T")[0]
        : null,
      payoutRatio: q.payoutRatio ? q.payoutRatio * 100 : null,

      // Ranges
      fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
      fiftyDayAverage: q.fiftyDayAverage ?? null,
      twoHundredDayAverage: q.twoHundredDayAverage ?? null,

      // Key stats
      beta: q.beta ?? null,
      eps: q.epsTrailingTwelveMonths ?? null,
      forwardEps: q.epsForward ?? null,
      profitMargin: q.profitMargins ? q.profitMargins * 100 : null,

      // Earnings
      earningsDate,
      earningsDateEnd,
    }
  } catch {
    return null
  }
}

async function fetchFromChartAPI(ticker: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d&includePrePost=false`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 60 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const meta = data?.chart?.result?.[0]?.meta
    if (!meta) return null

    const price = meta.regularMarketPrice || 0
    const prevClose = meta.chartPreviousClose || meta.previousClose || price
    const change = price - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    return {
      ticker,
      name: meta.shortName || meta.longName || ticker,
      price,
      change,
      changePercent,
      previousClose: prevClose,
      currency: meta.currency || "USD",
      exchange: meta.exchangeName || "",
      quoteType: meta.instrumentType || "EQUITY",
      open: null,
      dayHigh: null,
      dayLow: null,
      volume: null,
      avgVolume: null,
      marketCap: null,
      peRatio: null,
      forwardPE: null,
      pegRatio: null,
      priceToBook: null,
      priceToSales: null,
      bookValue: null,
      dividendYield: null,
      dividendRate: null,
      exDividendDate: null,
      payoutRatio: null,
      fiftyTwoWeekHigh: null,
      fiftyTwoWeekLow: null,
      fiftyDayAverage: null,
      twoHundredDayAverage: null,
      beta: null,
      eps: null,
      forwardEps: null,
      profitMargin: null,
      earningsDate: null,
      earningsDateEnd: null,
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
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=10&quotesCount=0&enableFuzzyQuery=false`
    const res = await fetch(url, {
      headers: { "User-Agent": UA },
      next: { revalidate: 600 },
    })
    if (!res.ok) return []

    const data = await res.json()
    const news = data?.news || []

    return news.slice(0, 10).map((item: Record<string, unknown>) => ({
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
