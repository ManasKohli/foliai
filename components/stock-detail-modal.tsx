"use client"

import { useState, useEffect, useCallback } from "react"
import { X, TrendingUp, TrendingDown, Loader2, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts"

const RANGES = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "All" },
] as const

interface StockDetailModalProps {
  ticker: string
  name: string
  onClose: () => void
}

interface ChartPoint {
  time: string
  price: number
  timestamp: number
}

interface QuoteData {
  price: number
  change: number
  changePercent: number
  previousClose: number
  currency: string
  name: string
}

export function StockDetailModal({ ticker, name, onClose }: StockDetailModalProps) {
  const [range, setRange] = useState<string>("1M")
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch quote
  useEffect(() => {
    async function fetchQuote() {
      try {
        const res = await fetch(`/api/stock-prices?tickers=${encodeURIComponent(ticker)}`)
        if (res.ok) {
          const data = await res.json()
          const q = data.quotes?.[ticker]
          if (q) setQuote(q)
        }
      } catch {
        // ignore
      }
    }
    fetchQuote()
  }, [ticker])

  // Fetch chart data for selected range
  const fetchChart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/stock-prices?tickers=${encodeURIComponent(ticker)}&history=${range}`
      )
      if (res.ok) {
        const data = await res.json()
        const chart = data.charts?.[ticker]
        if (chart && chart.timestamps.length > 0) {
          const points: ChartPoint[] = chart.timestamps.map(
            (ts: number, i: number) => ({
              timestamp: ts,
              time: formatLabel(ts, range),
              price: chart.closes[i],
            })
          )
          // Downsample if too many points
          const maxPts = range === "1D" ? 78 : range === "1W" ? 50 : 60
          if (points.length > maxPts) {
            const step = Math.ceil(points.length / maxPts)
            const sampled = points.filter((_, i) => i % step === 0)
            // always include last
            if (sampled[sampled.length - 1] !== points[points.length - 1]) {
              sampled.push(points[points.length - 1])
            }
            setChartData(sampled)
          } else {
            setChartData(points)
          }
        } else {
          setChartData([])
        }
      }
    } catch {
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [ticker, range])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [onClose])

  const firstPrice = chartData.length > 0 ? chartData[0].price : 0
  const lastPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0
  const rangeChange = lastPrice - firstPrice
  const rangeChangePct = firstPrice > 0 ? (rangeChange / firstPrice) * 100 : 0
  const isUp = rangeChange >= 0

  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((d) => d.price)) : 0
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((d) => d.price)) : 0
  const pricePad = (maxPrice - minPrice) * 0.08 || 1

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <Card className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto z-10 border-border/60 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-foreground">{ticker}</h2>
                {quote && (
                  <Badge
                    variant="outline"
                    className={
                      quote.changePercent >= 0
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }
                  >
                    {quote.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 mr-1" />
                    ) : (
                      <TrendingDown className="h-3 w-3 mr-1" />
                    )}
                    {quote.changePercent >= 0 ? "+" : ""}
                    {quote.changePercent.toFixed(2)}% today
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{name}</p>
              {quote && (
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-3xl font-bold tabular-nums text-foreground">
                    {quote.currency === "CAD" ? "C" : ""}${quote.price.toFixed(2)}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      quote.change >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {quote.change >= 0 ? "+" : ""}
                    {quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}
                    {quote.changePercent.toFixed(2)}%)
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`https://finance.yahoo.com/quote/${ticker}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="View on Yahoo Finance"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          {/* Range buttons */}
          <div className="flex gap-1 mb-4">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
                  range === r.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Range change badge */}
          {chartData.length > 1 && !loading && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm text-muted-foreground">{range} change:</span>
              <span
                className={`text-sm font-semibold ${
                  isUp ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {isUp ? "+" : ""}${rangeChange.toFixed(2)} ({isUp ? "+" : ""}
                {rangeChangePct.toFixed(2)}%)
              </span>
            </div>
          )}

          {/* Chart */}
          <div className="h-80 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : chartData.length < 2 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No chart data available for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id={`stockGrad-${ticker}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={isUp ? "#10b981" : "#ef4444"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                    minTickGap={50}
                  />
                  <YAxis
                    domain={[minPrice - pricePad, maxPrice + pricePad]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "13px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number) => [
                      `$${value.toFixed(2)}`,
                      ticker,
                    ]}
                    labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke={isUp ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                    fill={`url(#stockGrad-${ticker})`}
                    animationDuration={600}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stats row */}
          {quote && (
            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
              <div>
                <span className="text-xs text-muted-foreground">Previous Close</span>
                <p className="text-sm font-semibold text-foreground tabular-nums">
                  ${quote.previousClose.toFixed(2)}
                </p>
              </div>
              {chartData.length > 0 && (
                <>
                  <div>
                    <span className="text-xs text-muted-foreground">{range} Low</span>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      ${minPrice.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{range} High</span>
                    <p className="text-sm font-semibold text-foreground tabular-nums">
                      ${maxPrice.toFixed(2)}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function formatLabel(ts: number, range: string): string {
  const d = new Date(ts * 1000)
  switch (range) {
    case "1D":
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    case "1W":
      return d.toLocaleDateString("en-US", { weekday: "short", hour: "numeric" })
    case "1M":
    case "3M":
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    case "YTD":
    case "1Y":
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    case "ALL":
      return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    default:
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }
}
