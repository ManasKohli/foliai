import { NextResponse } from "next/server"

// Yahoo Finance search endpoint — returns matching tickers from all global exchanges
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ results: [] })
  }

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0&listsCount=0&enableFuzzyQuery=false`
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error(`Yahoo returned ${res.status}`)

    const data = await res.json()
    const quotes = data?.quotes || []

    const results = quotes
      .filter((q: Record<string, string>) =>
        q.quoteType === "EQUITY" || q.quoteType === "ETF" || q.quoteType === "INDEX"
      )
      .map((q: Record<string, string>) => ({
        ticker: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType === "ETF" ? "etf" : "stock",
        exchange: mapExchange(q.exchange, q.symbol),
        sector: null as string | null,
      }))

    return NextResponse.json({ results })
  } catch {
    // Fallback: return empty — the client has a local list as well
    return NextResponse.json({ results: [] })
  }
}

function mapExchange(exchange: string | undefined, symbol: string): string {
  if (!exchange) {
    if (symbol.endsWith(".TO")) return "TSX"
    return "US"
  }
  const e = exchange.toUpperCase()
  if (e.includes("TOR") || e.includes("TSX") || e === "TSE") return "TSX"
  if (e.includes("NAS") || e === "NMS" || e === "NGM" || e === "NCM") return "NASDAQ"
  if (e.includes("NYQ") || e.includes("NYSE") || e === "NYQ") return "NYSE"
  if (e.includes("LSE") || e === "LON") return "LSE"
  if (e.includes("HKG") || e === "HKG") return "HKSE"
  if (e.includes("TYO") || e === "JPX") return "TYO"
  if (e.includes("ASX")) return "ASX"
  if (e.includes("FRA")) return "FRA"
  return exchange
}
