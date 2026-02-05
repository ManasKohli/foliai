"use client"

import { useState, useEffect, useMemo } from "react"
import { TrendingUp, TrendingDown, Minus, Loader2, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

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
] as const

type TimeRange = (typeof TIME_RANGES)[number]["key"]

export function PortfolioPerformance({ holdings }: { holdings: Holding[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [loading, setLoading] = useState(true)
  const [selectedRange, setSelectedRange] = useState<TimeRange>("1D")

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }
    const fetchPrices = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/stock-prices?tickers=${tickers.join(",")}`)
        if (res.ok) {
          const data = await res.json()
          setPrices(data.quotes || {})
        }
      } catch {
        // prices stay empty
      } finally {
        setLoading(false)
      }
    }
    fetchPrices()
    // Refresh every 2 minutes
    const interval = setInterval(fetchPrices, 120000)
    return () => clearInterval(interval)
  }, [tickers])

  // Calculate total portfolio value and daily change
  const portfolioStats = useMemo(() => {
    let totalValue = 0
    let totalPrevValue = 0
    let holdingsWithPrice = 0

    for (const holding of holdings) {
      const priceData = prices[holding.ticker]
      if (priceData && holding.quantity) {
        totalValue += priceData.price * holding.quantity
        totalPrevValue += priceData.previousClose * holding.quantity
        holdingsWithPrice++
      }
    }

    const totalChange = totalValue - totalPrevValue
    const totalChangePercent = totalPrevValue > 0 ? (totalChange / totalPrevValue) * 100 : 0

    // Per-holding breakdown with real prices
    const holdingBreakdown = holdings.map((h) => {
      const p = prices[h.ticker]
      return {
        ticker: h.ticker,
        price: p?.price || 0,
        change: p?.change || 0,
        changePercent: p?.changePercent || 0,
        value: p && h.quantity ? p.price * h.quantity : 0,
        currency: p?.currency || "USD",
        hasPrice: !!p,
      }
    }).sort((a, b) => Math.abs(b.change) - Math.abs(a.change))

    return {
      totalValue,
      totalPrevValue,
      totalChange,
      totalChangePercent,
      holdingsWithPrice,
      holdingBreakdown,
    }
  }, [holdings, prices])

  // Generate simulated historical chart data based on real today price
  const chartData = useMemo(() => {
    const { totalValue, totalChangePercent } = portfolioStats
    if (totalValue === 0) return []

    const points: { label: string; value: number }[] = []
    let numPoints = 24
    let labelFn: (i: number, total: number) => string

    switch (selectedRange) {
      case "1D":
        numPoints = 24
        labelFn = (i) => `${(9 + Math.floor(i * 7 / 24)).toString().padStart(2, "0")}:${(i % 4 * 15).toString().padStart(2, "0")}`
        break
      case "1W":
        numPoints = 7
        labelFn = (i) => {
          const d = new Date()
          d.setDate(d.getDate() - (6 - i))
          return d.toLocaleDateString("en-US", { weekday: "short" })
        }
        break
      case "1M":
        numPoints = 22
        labelFn = (i) => {
          const d = new Date()
          d.setDate(d.getDate() - (21 - i))
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        }
        break
      case "3M":
        numPoints = 13
        labelFn = (i) => {
          const d = new Date()
          d.setDate(d.getDate() - (12 - i) * 7)
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        }
        break
      case "YTD":
        numPoints = new Date().getMonth() + 1
        labelFn = (i) => {
          const d = new Date(new Date().getFullYear(), i, 1)
          return d.toLocaleDateString("en-US", { month: "short" })
        }
        break
      case "1Y":
        numPoints = 12
        labelFn = (i) => {
          const d = new Date()
          d.setMonth(d.getMonth() - (11 - i))
          return d.toLocaleDateString("en-US", { month: "short" })
        }
        break
    }

    // Scale factor based on range
    const rangeMultiplier: Record<TimeRange, number> = {
      "1D": 1,
      "1W": 2.5,
      "1M": 5,
      "3M": 10,
      "1Y": 18,
      "YTD": 12,
    }
    const scale = rangeMultiplier[selectedRange]
    const baseChange = totalChangePercent * scale

    // Generate a realistic-looking price curve
    const startValue = totalValue / (1 + baseChange / 100)
    const seed = tickers.join("").length + selectedRange.charCodeAt(0)

    for (let i = 0; i < numPoints; i++) {
      const progress = i / (numPoints - 1)
      // Smooth curve with some randomness
      const trend = startValue + (totalValue - startValue) * progress
      const noise = Math.sin(seed + i * 2.7) * (totalValue * 0.005) + Math.cos(seed + i * 1.3) * (totalValue * 0.003)
      points.push({
        label: labelFn(i, numPoints),
        value: Math.round((trend + noise) * 100) / 100,
      })
    }

    // Ensure last point matches actual value
    if (points.length > 0) {
      points[points.length - 1].value = Math.round(totalValue * 100) / 100
    }

    return points
  }, [portfolioStats, selectedRange, tickers])

  const isUp = portfolioStats.totalChange > 0
  const isFlat = portfolioStats.totalChange === 0

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
            Add holdings with share quantities to track performance.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Portfolio Performance
            </CardTitle>
            {loading ? (
              <div className="flex items-center gap-1.5 mt-1 text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span className="text-xs">Fetching live prices...</span>
              </div>
            ) : portfolioStats.totalValue > 0 ? (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  ${portfolioStats.totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-emerald-400" : isFlat ? "text-muted-foreground" : "text-red-400"}`}>
                  {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : isFlat ? <Minus className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  <span className="tabular-nums">
                    {isUp ? "+" : ""}{portfolioStats.totalChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="tabular-nums">
                    ({isUp ? "+" : ""}{portfolioStats.totalChangePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Add share quantities to see portfolio value</p>
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
        {chartData.length > 1 && (
          <div className="h-48 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="perfGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(215, 20%, 50%)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(217, 33%, 17%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                    fontSize: "12px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, "Value"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)"}
                  fill="url(#perfGradient)"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3, fill: isUp ? "hsl(142, 71%, 45%)" : "hsl(0, 84%, 60%)" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top movers */}
        {portfolioStats.holdingBreakdown.filter((h) => h.hasPrice).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today{"'"}s Movers</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {portfolioStats.holdingBreakdown
                .filter((h) => h.hasPrice)
                .slice(0, 6)
                .map((h) => {
                  const hUp = h.changePercent > 0
                  const hFlat = h.changePercent === 0
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
                            hUp ? "border-emerald-500/30 text-emerald-400" : hFlat ? "" : "border-red-500/30 text-red-400"
                          }`}
                        >
                          {hUp ? "+" : ""}{h.changePercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {h.currency === "CAD" ? "C" : ""}${h.price.toFixed(2)}
                        </span>
                        <span className={`text-xs tabular-nums ${hUp ? "text-emerald-400" : hFlat ? "text-muted-foreground" : "text-red-400"}`}>
                          {hUp ? "+" : ""}{h.change.toFixed(2)}
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
