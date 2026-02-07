import { NextResponse } from "next/server"
import { fetchYahooFinance, buildSearchPath } from "@/lib/yahoo-finance"

interface SearchResponse {
  quotes?: Array<{
    symbol?: string
    shortname?: string
    longname?: string
    quoteType?: string
    exchange?: string
  }>
}

// Yahoo Finance search -- v1/finance/search (works reliably)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")

  if (!q || q.trim().length < 1) {
    return NextResponse.json({ results: [] })
  }

  const path = buildSearchPath(q, 12)
  const { data, error } = await fetchYahooFinance<SearchResponse>(path, {
    revalidate: 300,
  })

  if (error) {
    console.error(`[StockSearch] Search failed for "${q}": ${error}`)
    return NextResponse.json({ results: [] })
  }

  const quotes = data?.quotes || []

  const results = quotes
    .filter(
      (item) =>
        item.quoteType === "EQUITY" ||
        item.quoteType === "ETF" ||
        item.quoteType === "INDEX"
    )
    .map((item) => ({
      ticker: item.symbol,
      name: item.shortname || item.longname || item.symbol,
      type: item.quoteType === "ETF" ? "etf" : "stock",
      exchange: mapExchange(item.exchange, item.symbol || ""),
      sector: null as string | null,
    }))

  return NextResponse.json({ results })
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
