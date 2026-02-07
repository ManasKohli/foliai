import { NextResponse } from "next/server"
import {
  fetchYahooFinance,
  buildChartPath,
  buildQuoteSummaryPath,
  buildSearchPath,
} from "@/lib/yahoo-finance"

// GET /api/stock-detail?ticker=AAPL
// Returns quote data + news using ONLY working Yahoo Finance endpoints
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ticker = searchParams.get("ticker")?.trim().toUpperCase()

  if (!ticker) {
    return NextResponse.json({ error: "Missing ticker param" }, { status: 400 })
  }

  const [quoteData, newsData] = await Promise.all([
    fetchQuoteFromChart(ticker),
    fetchTickerNews(ticker),
  ])

  return NextResponse.json({ quote: quoteData, news: newsData })
}

interface ChartMeta {
  regularMarketPrice?: number
  chartPreviousClose?: number
  previousClose?: number
  shortName?: string
  longName?: string
  currency?: string
  exchangeName?: string
  fullExchangeName?: string
  instrumentType?: string
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
}

interface ChartQuote {
  high?: (number | null)[]
  low?: (number | null)[]
  open?: (number | null)[]
  close?: (number | null)[]
  volume?: (number | null)[]
}

interface ChartResult {
  meta: ChartMeta
  timestamp?: number[]
  indicators?: {
    quote?: ChartQuote[]
  }
}

interface ChartResponse {
  chart?: {
    result?: ChartResult[]
  }
}

interface QuoteSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      defaultKeyStatistics?: Record<string, { raw?: number }>
      financialData?: Record<string, { raw?: number }>
      summaryDetail?: Record<string, { raw?: number }>
      calendarEvents?: {
        earnings?: {
          earningsDate?: Array<{ raw?: number }>
        }
      }
      price?: Record<string, { raw?: number }>
    }>
  }
}

// Use v8/finance/chart which WORKS -- gets price data from meta
// Then try v10/finance/quoteSummary for fundamentals (may or may not work)
async function fetchQuoteFromChart(ticker: string) {
  // Step 1: Get basic price from v8 chart (always works)
  const chartPath = buildChartPath(ticker, "5d", "1d")
  const { data: chartJson, error: chartError } =
    await fetchYahooFinance<ChartResponse>(chartPath, { revalidate: 60 })

  if (chartError || !chartJson) {
    console.error(`[StockDetail] Chart fetch failed for ${ticker}: ${chartError}`)
    return null
  }

  const result = chartJson?.chart?.result?.[0]
  if (!result) {
    console.warn(`[StockDetail] No chart data returned for ${ticker}`)
    return null
  }

  const meta = result.meta
  const price = meta?.regularMarketPrice ?? 0
  const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price
  const change = price - prevClose
  const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

  // Build base quote from chart meta
  const baseQuote = {
    ticker,
    name: meta?.shortName || meta?.longName || ticker,
    price,
    change,
    changePercent,
    previousClose: prevClose,
    open: null as number | null,
    dayHigh: null as number | null,
    dayLow: null as number | null,
    volume: null as number | null,
    avgVolume: null as number | null,
    marketCap: null as number | null,
    currency: meta?.currency || "USD",
    exchange: meta?.exchangeName || meta?.fullExchangeName || "",
    quoteType: meta?.instrumentType || "EQUITY",
    peRatio: null as number | null,
    forwardPE: null as number | null,
    pegRatio: null as number | null,
    priceToBook: null as number | null,
    priceToSales: null as number | null,
    bookValue: null as number | null,
    dividendYield: null as number | null,
    dividendRate: null as number | null,
    exDividendDate: null as string | null,
    payoutRatio: null as number | null,
    fiftyTwoWeekHigh: null as number | null,
    fiftyTwoWeekLow: null as number | null,
    fiftyDayAverage: null as number | null,
    twoHundredDayAverage: null as number | null,
    beta: null as number | null,
    eps: null as number | null,
    forwardEps: null as number | null,
    profitMargin: null as number | null,
    earningsDate: null as string | null,
    earningsDateEnd: null as string | null,
  }

  // Extract 52-week from meta if available
  if (meta?.fiftyTwoWeekHigh) baseQuote.fiftyTwoWeekHigh = meta.fiftyTwoWeekHigh
  if (meta?.fiftyTwoWeekLow) baseQuote.fiftyTwoWeekLow = meta.fiftyTwoWeekLow

  // Get today's OHLCV from indicator data
  const quotes = result.indicators?.quote?.[0]
  const timestamps = result.timestamp
  if (quotes && timestamps && timestamps.length > 0) {
    const lastIdx = timestamps.length - 1
    baseQuote.dayHigh = quotes.high?.[lastIdx] ?? null
    baseQuote.dayLow = quotes.low?.[lastIdx] ?? null
    baseQuote.open = quotes.open?.[lastIdx] ?? null
    baseQuote.volume = quotes.volume?.[lastIdx] ?? null
  }

  // Step 2: Try v10 quoteSummary for fundamentals (may fail due to Yahoo's crumb requirement)
  const summaryPath = buildQuoteSummaryPath(ticker, [
    "defaultKeyStatistics",
    "financialData",
    "summaryDetail",
    "calendarEvents",
    "price",
  ])
  const { data: summaryJson, error: summaryError } = await fetchYahooFinance<QuoteSummaryResponse>(
    summaryPath,
    { revalidate: 300, requiresCrumb: false }
  )

  if (summaryError) {
    console.warn(`[StockDetail] v10 quoteSummary failed for ${ticker} (expected due to Yahoo auth): ${summaryError}`)
  }

  if (summaryJson?.quoteSummary?.result?.[0]) {
    const r = summaryJson.quoteSummary.result[0]
    const ks = r.defaultKeyStatistics || {}
    const fd = r.financialData || {}
    const sd = r.summaryDetail || {}
    const ce = r.calendarEvents || {}
    const pr = r.price || {}

    baseQuote.marketCap = pr.marketCap?.raw ?? sd.marketCap?.raw ?? null
    baseQuote.peRatio = sd.trailingPE?.raw ?? null
    baseQuote.forwardPE = ks.forwardPE?.raw ?? sd.forwardPE?.raw ?? null
    baseQuote.pegRatio = ks.pegRatio?.raw ?? null
    baseQuote.priceToBook = ks.priceToBook?.raw ?? null
    baseQuote.priceToSales = pr.priceToSalesTrailing12Months?.raw ?? null
    baseQuote.bookValue = ks.bookValue?.raw ?? null
    baseQuote.beta = ks.beta?.raw ?? null
    baseQuote.eps = ks.trailingEps?.raw ?? fd.earningsPerShare?.raw ?? null
    baseQuote.forwardEps = ks.forwardEps?.raw ?? null
    baseQuote.profitMargin = fd.profitMargins?.raw
      ? fd.profitMargins.raw * 100
      : null

    baseQuote.dividendYield = sd.dividendYield?.raw
      ? sd.dividendYield.raw * 100
      : null
    baseQuote.dividendRate = sd.dividendRate?.raw ?? null
    baseQuote.payoutRatio = sd.payoutRatio?.raw
      ? sd.payoutRatio.raw * 100
      : null
    if (sd.exDividendDate?.raw) {
      baseQuote.exDividendDate = new Date(sd.exDividendDate.raw * 1000)
        .toISOString()
        .split("T")[0]
    }

    baseQuote.fiftyDayAverage = sd.fiftyDayAverage?.raw ?? null
    baseQuote.twoHundredDayAverage = sd.twoHundredDayAverage?.raw ?? null
    if (sd.fiftyTwoWeekHigh?.raw) baseQuote.fiftyTwoWeekHigh = sd.fiftyTwoWeekHigh.raw
    if (sd.fiftyTwoWeekLow?.raw) baseQuote.fiftyTwoWeekLow = sd.fiftyTwoWeekLow.raw

    baseQuote.avgVolume =
      sd.averageDailyVolume10Day?.raw ?? sd.averageVolume?.raw ?? null

    // Earnings dates from calendarEvents
    const earnings = ce.earnings || {}
    const earningsDates = earnings.earningsDate || []
    if (earningsDates.length > 0 && earningsDates[0]?.raw) {
      baseQuote.earningsDate = new Date(earningsDates[0].raw * 1000)
        .toISOString()
        .split("T")[0]
    }
    if (earningsDates.length > 1 && earningsDates[1]?.raw) {
      baseQuote.earningsDateEnd = new Date(earningsDates[1].raw * 1000)
        .toISOString()
        .split("T")[0]
    }
  }

  // Step 3: If v10 failed, try getting 52-week data from 1Y chart
  if (baseQuote.fiftyTwoWeekHigh === null) {
    const yearPath = buildChartPath(ticker, "1y", "1wk")
    const { data: yearJson } = await fetchYahooFinance<ChartResponse>(yearPath, {
      revalidate: 3600,
    })

    const yearResult = yearJson?.chart?.result?.[0]
    if (yearResult) {
      const highs = yearResult.indicators?.quote?.[0]?.high || []
      const lows = yearResult.indicators?.quote?.[0]?.low || []
      const closes = yearResult.indicators?.quote?.[0]?.close || []
      const validHighs = highs.filter((h): h is number => h != null)
      const validLows = lows.filter((l): l is number => l != null)
      if (validHighs.length > 0)
        baseQuote.fiftyTwoWeekHigh = Math.max(...validHighs)
      if (validLows.length > 0) baseQuote.fiftyTwoWeekLow = Math.min(...validLows)

      // Calculate moving averages from closes
      const validCloses = closes.filter((c): c is number => c != null)
      if (validCloses.length >= 10) {
        // ~50 day from weekly data (last ~7 weeks)
        const last7 = validCloses.slice(-7)
        baseQuote.fiftyDayAverage =
          last7.reduce((a, b) => a + b, 0) / last7.length
      }
      if (validCloses.length >= 26) {
        // ~200 day from weekly data (last ~29 weeks)
        const last29 = validCloses.slice(-29)
        baseQuote.twoHundredDayAverage =
          last29.reduce((a, b) => a + b, 0) / last29.length
      }
    }
  }

  return baseQuote
}

interface NewsArticle {
  title: string
  publisher: string
  link: string
  publishedAt: string
  thumbnail?: string
}

interface SearchResponse {
  news?: Array<{
    title?: string
    publisher?: string
    link?: string
    providerPublishTime?: number
    thumbnail?: {
      resolutions?: Array<{ url?: string }>
    }
  }>
}

async function fetchTickerNews(ticker: string): Promise<NewsArticle[]> {
  const searchPath = `/v1/finance/search?q=${encodeURIComponent(ticker)}&newsCount=10&quotesCount=0&enableFuzzyQuery=false`
  const { data, error } = await fetchYahooFinance<SearchResponse>(searchPath, {
    revalidate: 600,
  })

  if (error || !data) {
    console.error(`[StockDetail] News fetch failed for ${ticker}: ${error}`)
    return []
  }

  const news = data?.news || []
  return news.slice(0, 10).map((item) => ({
    title: item.title || "",
    publisher: item.publisher || "",
    link: item.link || "",
    publishedAt: item.providerPublishTime
      ? new Date(item.providerPublishTime * 1000).toISOString()
      : "",
    thumbnail: item.thumbnail?.resolutions?.[0]?.url,
  }))
}
