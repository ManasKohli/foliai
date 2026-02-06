"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ── symbols ── */
const SECTIONS = [
  {
    id: "futures",
    title: "Equity Futures",
    subtitle: "E-mini S&P 500 and Nasdaq futures set the tone for the day",
    instruments: [
      { ticker: "ES=F", label: "E-mini S&P 500", short: "ES" },
      { ticker: "NQ=F", label: "E-mini Nasdaq 100", short: "NQ" },
      { ticker: "YM=F", label: "E-mini Dow", short: "YM" },
    ],
  },
  {
    id: "gold",
    title: "Gold & Commodities",
    subtitle: "Gold trades overnight on the COMEX -- a key safe-haven signal",
    instruments: [
      { ticker: "GC=F", label: "Gold Futures", short: "Gold" },
      { ticker: "SI=F", label: "Silver Futures", short: "Silver" },
      { ticker: "CL=F", label: "Crude Oil WTI", short: "Oil" },
    ],
  },
  {
    id: "dollar",
    title: "US Dollar",
    subtitle: "How the dollar performed overnight vs major currencies",
    instruments: [
      { ticker: "DX-Y.NYB", label: "US Dollar Index (DXY)", short: "DXY" },
      { ticker: "CADUSD=X", label: "CAD/USD", short: "CAD" },
      { ticker: "USDJPY=X", label: "USD/JPY", short: "JPY" },
      { ticker: "EURUSD=X", label: "EUR/USD", short: "EUR" },
    ],
  },
  {
    id: "rates",
    title: "Interest Rates",
    subtitle: "The 10-year yield is the proxy for the most liquid market in the world -- the US bond market",
    instruments: [
      { ticker: "^IRX", label: "13-Week T-Bill", short: "3M" },
      { ticker: "^FVX", label: "5-Year Yield", short: "5Y" },
      { ticker: "^TNX", label: "10-Year Yield", short: "10Y" },
      { ticker: "^TYX", label: "30-Year Yield", short: "30Y" },
    ],
  },
] as const

type QuoteData = {
  price: number
  change: number
  changePercent: number
  previousClose: number
  name: string
  currency: string
}

type ChartPoint = { time: string; value: number }

function getDirection(change: number): "up" | "down" | "flat" {
  if (change > 0.005) return "up"
  if (change < -0.005) return "down"
  return "flat"
}

function formatPrice(price: number, ticker: string): string {
  // Yields are already in percent form
  if (["^IRX", "^FVX", "^TNX", "^TYX"].includes(ticker)) {
    return `${price.toFixed(3)}%`
  }
  if (ticker.includes("=X")) return price.toFixed(4)
  if (price > 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return price.toFixed(2)
}

/* ── mini sparkline component ── */
function Sparkline({ data, color }: { data: ChartPoint[]; color: string }) {
  if (data.length < 2) return <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">No chart data</div>
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = (max - min) * 0.1 || 1
  const prevClose = data[0].value

  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={[min - pad, max + pad]} hide />
        <XAxis dataKey="time" hide />
        <ReferenceLine y={prevClose} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" strokeOpacity={0.3} />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null
            return (
              <div className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border">
                {Number(payload[0].value).toFixed(2)}
              </div>
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#spark-${color})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

/* ── single instrument card ── */
function InstrumentCard({
  ticker,
  label,
  short,
  quote,
  chart,
}: {
  ticker: string
  label: string
  short: string
  quote: QuoteData | null
  chart: ChartPoint[]
}) {
  const dir = quote ? getDirection(quote.change) : "flat"
  const color =
    dir === "up"
      ? "hsl(142, 71%, 45%)"
      : dir === "down"
        ? "hsl(0, 84%, 60%)"
        : "hsl(var(--muted-foreground))"

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-semibold text-foreground">{short}</p>
        </div>
        {quote ? (
          <div className="text-right">
            <p className="text-sm font-mono font-semibold text-foreground">
              {formatPrice(quote.price, ticker)}
            </p>
            <div className={cn("flex items-center gap-1 text-xs font-medium", dir === "up" ? "text-emerald-400" : dir === "down" ? "text-red-400" : "text-muted-foreground")}>
              {dir === "up" ? <TrendingUp className="h-3 w-3" /> : dir === "down" ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span>{quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)}</span>
              <span>({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)</span>
            </div>
          </div>
        ) : (
          <div className="h-8 w-20 rounded bg-muted animate-pulse" />
        )}
      </div>
      <Sparkline data={chart} color={color} />
    </div>
  )
}

/* ── main component ── */
export function OvernightBriefing() {
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [charts, setCharts] = useState<Record<string, ChartPoint[]>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const allTickers = SECTIONS.flatMap((s) => s.instruments.map((i) => i.ticker))

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const tickerStr = allTickers.join(",")
      const [quotesRes, histRes] = await Promise.all([
        fetch(`/api/stock-prices?tickers=${encodeURIComponent(tickerStr)}`),
        fetch(`/api/stock-prices?tickers=${encodeURIComponent(tickerStr)}&history=1D`),
      ])

      if (quotesRes.ok) {
        const qData = await quotesRes.json()
        setQuotes(qData.quotes || {})
      }

      if (histRes.ok) {
        const hData = await histRes.json()
        const chartMap: Record<string, ChartPoint[]> = {}
        const rawCharts = hData.charts || {}
        for (const [ticker, cData] of Object.entries(rawCharts)) {
          const { timestamps, closes } = cData as { timestamps: number[]; closes: number[] }
          chartMap[ticker] = timestamps.map((ts: number, i: number) => ({
            time: new Date(ts * 1000).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            value: closes[i],
          }))
        }
        setCharts(chartMap)
      }
      setLastUpdated(new Date())
    } catch (e) {
      console.error("[v0] OvernightBriefing fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-8">
      {/* Last updated + refresh */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {lastUpdated
            ? `Last updated ${lastUpdated.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : "Loading..."}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {SECTIONS.map((section) => (
        <Card key={section.id} className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{section.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{section.subtitle}</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {section.instruments.map((inst) => (
                <InstrumentCard
                  key={inst.ticker}
                  ticker={inst.ticker}
                  label={inst.label}
                  short={inst.short}
                  quote={quotes[inst.ticker] || null}
                  chart={charts[inst.ticker] || []}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <p className="text-xs text-muted-foreground text-center">
        Data from Yahoo Finance. Delayed up to 15 minutes. For informational purposes only -- not financial advice.
      </p>
    </div>
  )
}
