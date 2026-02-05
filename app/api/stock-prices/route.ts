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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tickers = searchParams.get("tickers")

  if (!tickers) {
    return NextResponse.json({ error: "Missing tickers param" }, { status: 400 })
  }

  const tickerList = tickers.split(",").map((t) => t.trim().toUpperCase()).slice(0, 30)

  try {
    // Yahoo Finance v8 API (free, no key needed)
    const symbols = tickerList.join(",")
    const url = `https://query1.finance.yahoo.com/v8/finance/spark?symbols=${encodeURIComponent(symbols)}&range=1d&interval=5m`

    const quoteUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`
    const res = await fetch(quoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: { revalidate: 60 }, // cache 1 min
    })

    if (!res.ok) {
      throw new Error(`Yahoo Finance returned ${res.status}`)
    }

    const data = await res.json()
    const quotes: Record<string, {
      price: number
      change: number
      changePercent: number
      previousClose: number
      name: string
      currency: string
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
  } catch (err) {
    // Fallback: try individual fetches for a smaller set
    try {
      const quotes: Record<string, {
        price: number
        change: number
        changePercent: number
        previousClose: number
        name: string
        currency: string
      }> = {}

      // Use chart API as fallback (more reliable)
      const fetchPromises = tickerList.slice(0, 10).map(async (ticker) => {
        try {
          const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`
          const chartRes = await fetch(chartUrl, {
            headers: { "User-Agent": "Mozilla/5.0" },
            next: { revalidate: 60 },
          })
          if (!chartRes.ok) return null
          const chartData = await chartRes.json()
          const meta = chartData?.chart?.result?.[0]?.meta
          if (meta) {
            const price = meta.regularMarketPrice || 0
            const prevClose = meta.chartPreviousClose || meta.previousClose || price
            const change = price - prevClose
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0
            quotes[ticker] = {
              price,
              change,
              changePercent,
              previousClose: prevClose,
              name: meta.shortName || ticker,
              currency: meta.currency || "USD",
            }
          }
        } catch {
          // skip this ticker
        }
      })

      await Promise.all(fetchPromises)
      return NextResponse.json({ quotes })
    } catch {
      return NextResponse.json({ quotes: {}, error: "Failed to fetch prices" })
    }
  }
}
