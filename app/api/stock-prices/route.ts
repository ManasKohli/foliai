import { NextResponse } from "next/server"
import { fetchYahooFinance, buildChartPath } from "@/lib/yahoo-finance"

interface YahooChartResult {
  meta: {
    regularMarketPrice?: number
    chartPreviousClose?: number
    previousClose?: number
    shortName?: string
    longName?: string
    currency?: string
  }
  timestamp?: number[]
  indicators?: {
    quote?: Array<{
      close?: (number | null)[]
    }>
  }
}

interface YahooChartResponse {
  chart?: {
    result?: YahooChartResult[]
    error?: { code: string; description: string }
  }
}

// GET /api/stock-prices?tickers=AAPL,MSFT — live quotes via v8 chart
// GET /api/stock-prices?tickers=AAPL,MSFT&history=1M — historical chart data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tickers = searchParams.get("tickers")
  const history = searchParams.get("history")

  if (!tickers) {
    return NextResponse.json({ error: "Missing tickers param" }, { status: 400 })
  }

  const tickerList = tickers
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 30)

  if (history) {
    return fetchHistoricalData(tickerList, history)
  }

  return fetchLiveQuotes(tickerList)
}

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D": { range: "1d", interval: "5m" },
  "1W": { range: "5d", interval: "30m" },
  "1M": { range: "1mo", interval: "1d" },
  "3M": { range: "3mo", interval: "1d" },
  YTD: { range: "ytd", interval: "1wk" },
  "1Y": { range: "1y", interval: "1wk" },
  ALL: { range: "max", interval: "1mo" },
}

async function fetchHistoricalData(tickerList: string[], range: string) {
  const params = RANGE_MAP[range] || RANGE_MAP["1M"]
  const chartResults: Record<string, { timestamps: number[]; closes: number[] }> = {}
  const errors: string[] = []

  await Promise.all(
    tickerList.map(async (ticker) => {
      const path = buildChartPath(ticker, params.range, params.interval)
      const { data, error } = await fetchYahooFinance<YahooChartResponse>(path, {
        revalidate: range === "1D" ? 60 : 300,
      })

      if (error) {
        console.error(`[StockPrices] Historical data failed for ${ticker}: ${error}`)
        errors.push(`${ticker}: ${error}`)
        return
      }

      const result = data?.chart?.result?.[0]
      if (!result) {
        console.warn(`[StockPrices] No historical data returned for ${ticker}`)
        return
      }

      const timestamps = result.timestamp || []
      const closes = result.indicators?.quote?.[0]?.close || []
      const validTs: number[] = []
      const validCloses: number[] = []

      for (let i = 0; i < timestamps.length; i++) {
        const ts = timestamps[i]
        const close = closes[i]
        if (close != null && ts != null) {
          validTs.push(ts)
          validCloses.push(close)
        }
      }

      chartResults[ticker] = { timestamps: validTs, closes: validCloses }
    })
  )

  return NextResponse.json({
    charts: chartResults,
    ...(errors.length > 0 && process.env.NODE_ENV === "development"
      ? { _errors: errors }
      : {}),
  })
}

async function fetchLiveQuotes(tickerList: string[]) {
  const quotes: Record<
    string,
    {
      price: number
      change: number
      changePercent: number
      previousClose: number
      name: string
      currency: string
    }
  > = {}
  const errors: string[] = []

  await Promise.all(
    tickerList.map(async (ticker) => {
      const path = buildChartPath(ticker, "2d", "1d")
      const { data, error } = await fetchYahooFinance<YahooChartResponse>(path, {
        revalidate: 60,
      })

      if (error) {
        console.error(`[StockPrices] Live quote failed for ${ticker}: ${error}`)
        errors.push(`${ticker}: ${error}`)
        return
      }

      const result = data?.chart?.result?.[0]
      if (!result) {
        console.warn(`[StockPrices] No quote data returned for ${ticker}`)
        return
      }

      const meta = result.meta
      const price = meta?.regularMarketPrice ?? 0
      const prevClose = meta?.chartPreviousClose ?? meta?.previousClose ?? price
      const change = price - prevClose
      const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

      quotes[ticker] = {
        price,
        change,
        changePercent,
        previousClose: prevClose,
        name: meta?.shortName || meta?.longName || ticker,
        currency: meta?.currency || "USD",
      }
    })
  )

  return NextResponse.json({
    quotes,
    ...(errors.length > 0 && process.env.NODE_ENV === "development"
      ? { _errors: errors }
      : {}),
  })
}
