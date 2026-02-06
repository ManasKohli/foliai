"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { TrendingUp, TrendingDown, Loader2, Calendar, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid } from "recharts"

interface Holding {
  id: string
  ticker: string
  quantity: number | null
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface PriceData {
  price: number
  change: number
  changePercent: number
  previousClose: number
  name: string
  currency: string
}

const TIME_RANGES = [
  { key: "1D", label: "1D" },
  { key: "1W", label: "1W" },
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y" },
  { key: "ALL", label: "All" },
] as const

type TimeRange = (typeof TIME_RANGES)[number]["key"]

function formatLabel(ts: number, range: TimeRange): string {
  const d = new Date(ts * 1000)
  switch (range) {
    case "1D":
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
    case "1W":
      return d.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", hour12: true })
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

export function PortfolioPerformance({ holdings }: { holdings: Holding[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [chartData, setChartData] = useState<{ label: string; value: number; ts: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1M")

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])
  const tickerKey = tickers.join(",")

  // Fetch live quotes for current prices/today's summary
  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }
    const fetchPrices = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/stock-prices?tickers=${tickerKey}`)
        if (res.ok) {
          const data = await res.json()
          setPrices(data.quotes || {})
        }
      } catch {
        // stay empty
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 120000)
    return () => clearInterval(interval)
  }, [tickerKey, tickers.length])

  const hasQuantities = useMemo(
    () => holdings.some((h) => h.quantity && h.quantity > 0),
    [holdings],
  )

  // Compute real total portfolio value from live prices
  const liveTotal = useMemo(() => {
    if (!hasQuantities) return 0
    let total = 0
    for (const h of holdings) {
      const p = prices[h.ticker]
      if (p && h.quantity) total += p.price * h.quantity
    }
    return total
  }, [holdings, prices, hasQuantities])

  // Compute real daily change from live prices (weighted by allocation or value)
  const liveDailyChange = useMemo(() => {
    let weightedSum = 0
    let totalWeight = 0
    for (const h of holdings) {
      const p = prices[h.ticker]
      if (!p) continue
      if (hasQuantities && h.quantity) {
        const val = p.previousClose * h.quantity
        weightedSum += p.changePercent * val
        totalWeight += val
      } else {
        const w = h.allocation_percent || 100 / holdings.length
        weightedSum += p.changePercent * w
        totalWeight += w
      }
    }
    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }, [holdings, prices, hasQuantities])

  // Fetch historical chart data
  const fetchChart = useCallback(async () => {
    if (tickers.length === 0) {
      setChartData([])
      return
    }
    setChartLoading(true)
    try {
      const res = await fetch(`/api/stock-prices?tickers=${tickerKey}&history=${selectedRange}`)
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      const charts: Record<string, { timestamps: number[]; closes: number[] }> = data.charts || {}

      // Collect all timestamps across all holdings
      const allTimestamps = new Set<number>()
      for (const ticker of tickers) {
        const chart = charts[ticker]
        if (chart) {
          for (const ts of chart.timestamps) allTimestamps.add(ts)
        }
      }
      const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b)
      if (sortedTimestamps.length === 0) {
        setChartData([])
        setChartLoading(false)
        return
      }

      // For each ticker build a lookup: ts -> close (with forward-fill)
      const tickerLookups = new Map<string, Map<number, number>>()
      for (const ticker of tickers) {
        const chart = charts[ticker]
        if (!chart || chart.timestamps.length === 0) continue
        const lookup = new Map<number, number>()
        for (let i = 0; i < chart.timestamps.length; i++) {
          lookup.set(chart.timestamps[i], chart.closes[i])
        }
        tickerLookups.set(ticker, lookup)
      }

      // Compute weights
      const totalAlloc = holdings.reduce((s, h) => s + (h.allocation_percent || 0), 0)

      // Build portfolio value at each timestamp
      const points: { label: string; value: number; ts: number }[] = []

      for (const ts of sortedTimestamps) {
        let portfolioValue = 0
        let validHoldings = 0

        for (const holding of holdings) {
          const lookup = tickerLookups.get(holding.ticker)
          if (!lookup) continue

          // Find closest price at or before this timestamp
          let price: number | null = null
          const chart = charts[holding.ticker]
          if (!chart) continue

          // Binary search-ish: find last timestamp <= ts
          for (let i = chart.timestamps.length - 1; i >= 0; i--) {
            if (chart.timestamps[i] <= ts) {
              price = chart.closes[i]
              break
            }
          }
          // If no price before, use first available if it's close
          if (price === null && chart.timestamps[0] <= ts + 86400 * 2) {
            price = chart.closes[0]
          }
          if (price === null) continue

          if (hasQuantities && holding.quantity && holding.quantity > 0) {
            // Real portfolio value: price * shares
            portfolioValue += price * holding.quantity
            validHoldings++
          } else {
            // Use allocation-based weighting: each holding gets its proportional
            // share of a $10k base. The key is to use shares = (base_value / first_price)
            // so the portfolio returns are properly weighted
            const weight = totalAlloc > 0
              ? (holding.allocation_percent || 0) / totalAlloc
              : 1 / holdings.length
            const baseValue = 10000 * weight
            const firstPrice = chart.closes[0]
            if (firstPrice > 0) {
              const shares = baseValue / firstPrice
              portfolioValue += price * shares
              validHoldings++
            }
          }
        }

        if (validHoldings > 0) {
          points.push({
            label: formatLabel(ts, selectedRange),
            value: Math.round(portfolioValue * 100) / 100,
            ts,
          })
        }
      }

      // Downsample
      const maxPoints =
        selectedRange === "1D" ? 48 : selectedRange === "1W" ? 40 : selectedRange === "ALL" ? 60 : 30
      const sampled =
        points.length > maxPoints
          ? (() => {
              const step = Math.ceil(points.length / maxPoints)
              const result = points.filter((_, i) => i % step === 0)
              if (result[result.length - 1] !== points[points.length - 1]) {
                result.push(points[points.length - 1])
              }
              return result
            })()
          : points

      setChartData(sampled)
    } catch {
      setChartData([])
    } finally {
      setChartLoading(false)
    }
  }, [tickerKey, selectedRange, holdings, tickers, hasQuantities])

  useEffect(() => {
    fetchChart()
  }, [fetchChart])

  // Chart-derived % change (for the range)
  const chartChange = useMemo(() => {
    if (chartData.length < 2) return { value: 0, percent: 0 }
    const first = chartData[0].value
    const last = chartData[chartData.length - 1].value
    const change = last - first
    const percent = first > 0 ? (change / first) * 100 : 0
    return { value: change, percent }
  }, [chartData])

  // For the 1D range, use the live daily change instead (more accurate)
  const displayChange = selectedRange === "1D" && Object.keys(prices).length > 0
    ? { percent: liveDailyChange, value: hasQuantities ? liveTotal * (liveDailyChange / 100) : 0 }
    : chartChange

  const isUp = displayChange.percent >= 0
  const lineColor = isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"

  if (holdings.length === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Portfolio Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add holdings to track performance across time.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Portfolio Performance
              {chartLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </CardTitle>
            {loading ? (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Fetching live prices...</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1">
                {hasQuantities && liveTotal > 0 && (
                  <span className="text-2xl font-bold text-foreground tabular-nums">
                    ${liveTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
                {(chartData.length > 1 || (selectedRange === "1D" && Object.keys(prices).length > 0)) && (
                  <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                    {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    <span className="tabular-nums">
                      {displayChange.percent >= 0 ? "+" : ""}{displayChange.percent.toFixed(2)}%
                    </span>
                    {hasQuantities && Math.abs(displayChange.value) > 0.01 && (
                      <span className="text-xs text-muted-foreground ml-0.5">
                        ({displayChange.value >= 0 ? "+" : ""}${Math.abs(displayChange.value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 ml-1 border-border/50 text-muted-foreground">
                      {selectedRange}
                    </Badge>
                  </div>
                )}
                {!hasQuantities && chartData.length < 2 && !chartLoading && (
                  <p className="text-xs text-muted-foreground">
                    Add share quantities for dollar values
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            {TIME_RANGES.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => setSelectedRange(range.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
                  selectedRange === range.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        {chartLoading && chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Loading {selectedRange} chart data...</span>
            </div>
          </div>
        ) : chartData.length > 1 ? (
          <div className="h-56 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={65}
                  tickFormatter={(v: number) => {
                    if (hasQuantities) {
                      return v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v.toFixed(0)}`
                    }
                    // For allocation-only mode, show relative values
                    return `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`
                  }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    hasQuantities ? "Portfolio Value" : "Simulated Value",
                  ]}
                  labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "11px", marginBottom: "4px" }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={lineColor}
                  fill="url(#perfGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: lineColor, stroke: "hsl(var(--card))", strokeWidth: 2 }}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Calendar className="h-6 w-6 opacity-40" />
              <span className="text-sm">No chart data available for {selectedRange}</span>
              <button
                type="button"
                onClick={fetchChart}
                className="text-xs flex items-center gap-1 text-primary hover:underline mt-1"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Today's Movers from live data */}
        {!loading && Object.keys(prices).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{"Today's"} Movers</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {holdings
                .filter((h) => prices[h.ticker])
                .sort((a, b) => Math.abs(prices[b.ticker]?.changePercent || 0) - Math.abs(prices[a.ticker]?.changePercent || 0))
                .slice(0, 6)
                .map((h) => {
                  const p = prices[h.ticker]
                  const hUp = p.changePercent > 0
                  return (
                    <div
                      key={h.ticker}
                      className="p-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all duration-200 hover:translate-y-[-1px]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-foreground">{h.ticker}</span>
                        <Badge
                          variant="outline"
                          className={`text-xs px-1 py-0 h-4 ${
                            hUp ? "border-emerald-500/30 text-emerald-400" : "border-red-500/30 text-red-400"
                          }`}
                        >
                          {hUp ? "+" : ""}{p.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {p.currency === "CAD" ? "C" : ""}${p.price.toFixed(2)}
                        </span>
                        <span className={`text-xs tabular-nums ${hUp ? "text-emerald-400" : "text-red-400"}`}>
                          {hUp ? "+" : ""}{p.change.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
