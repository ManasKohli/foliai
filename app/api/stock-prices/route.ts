import { NextResponse } from "next/server"

interface YahooQuote {
  symbol: string
  regularMarketPrice?: number
  regularMarketChange?: number
  regularMarketChangePercent?: number
  regularMarketPreviousClose?: number
  shortName?: string
  currency?: string
}

// GET /api/stock-prices?tickers=AAPL,MSFT — live quotes
// GET /api/stock-prices?tickers=AAPL,MSFT&history=1M — historical chart data
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tickers = searchParams.get("tickers")
  const history = searchParams.get("history") // 1D, 1W, 1M, 3M, YTD, 1Y

  if (!tickers) {
    return NextResponse.json({ error: "Missing tickers param" }, { status: 400 })
  }

  const tickerList = tickers.split(",").map((t) => t.trim().toUpperCase()).slice(0, 30)

  // If history param, return chart data for each ticker
  if (history) {
    return fetchHistoricalData(tickerList, history)
  }

  // Otherwise return live quotes
  return fetchLiveQuotes(tickerList)
}

async function fetchHistoricalData(tickerList: string[], range: string) {
  // Map our range keys to Yahoo Finance params
  const rangeMap: Record<string, { range: string; interval: string }> = {
    "1D": { range: "1d", interval: "5m" },
    "1W": { range: "5d", interval: "30m" },
    "1M": { range: "1mo", interval: "1d" },
    "3M": { range: "3mo", interval: "1d" },
    "YTD": { range: "ytd", interval: "1wk" },
    "1Y": { range: "1y", interval: "1wk" },
    "ALL": { range: "max", interval: "1mo" },
  }

  const params = rangeMap[range] || rangeMap["1M"]
  const chartResults: Record<string, { timestamps: number[]; closes: number[] }> = {}

  const fetchPromises = tickerList.map(async (ticker) => {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=${params.range}&interval=${params.interval}&includePrePost=false`
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        next: { revalidate: range === "1D" ? 60 : 300 },
      })
      if (!res.ok) return
      const data = await res.json()
      const result = data?.chart?.result?.[0]
      if (result) {
        const timestamps = result.timestamp || []
        const closes = result.indicators?.quote?.[0]?.close || []
        // Filter out null values
        const validTimestamps: number[] = []
        const validCloses: number[] = []
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] != null && timestamps[i] != null) {
            validTimestamps.push(timestamps[i])
            validCloses.push(closes[i])
          }
        }
        chartResults[ticker] = { timestamps: validTimestamps, closes: validCloses }
      }
    } catch {
      // skip ticker
    }
  })

  await Promise.all(fetchPromises)
  return NextResponse.json({ charts: chartResults })
}

async function fetchLiveQuotes(tickerList: string[]) {
  try {
    const symbols = tickerList.join(",")
    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`
    const res = await fetch(quoteUrl, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 60 },
    })

    if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`)

    const data = await res.json()
    const quotes: Record<string, {
      price: number; change: number; changePercent: number
      previousClose: number; name: string; currency: string
    }> = {}

    if (data?.quoteResponse?.result) {
      for (const q of data.quoteResponse.result as YahooQuote[]) {
        if (q.symbol && q.regularMarketPrice) {
          quotes[q.symbol] = {
            price: q.regularMarketPrice,
            change: q.regularMarketChange || 0,
            changePercent: q.regularMarketChangePercent || 0,
            previousClose: q.regularMarketPreviousClose || q.regularMarketPrice,
            name: q.shortName || q.symbol,
            currency: q.currency || "USD",
          }
        }
      }
    }
    return NextResponse.json({ quotes })
  } catch {
    // Fallback: chart API per ticker
    try {
      const quotes: Record<string, {
        price: number; change: number; changePercent: number
        previousClose: number; name: string; currency: string
      }> = {}

      await Promise.all(tickerList.slice(0, 10).map(async (ticker) => {
        try {
          const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`
          const chartRes = await fetch(chartUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 60 },
          })
          if (!chartRes.ok) return
          const chartData = await chartRes.json()
          const meta = chartData?.chart?.result?.[0]?.meta
          if (meta) {
            const price = meta.regularMarketPrice || 0
            const prevClose = meta.chartPreviousClose || meta.previousClose || price
            const change = price - prevClose
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
            quotes[ticker] = {
              price, change, changePercent, previousClose: prevClose,
              name: meta.shortName || ticker, currency: meta.currency || "USD",
            }
          }
        } catch { /* skip */ }
      }))
      return NextResponse.json({ quotes })
    } catch {
      return NextResponse.json({ quotes: {}, error: "Failed to fetch prices" })
    }
  }
}
