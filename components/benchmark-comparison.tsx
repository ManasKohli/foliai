"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { BarChart3, Loader2, RefreshCw, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts"

interface Holding {
  id: string
  ticker: string
  quantity: number | null
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

const BENCHMARKS = [
  { key: "^GSPC", label: "S&P 500", color: "hsl(38, 92%, 50%)" },
  { key: "^IXIC", label: "Nasdaq", color: "hsl(172, 66%, 50%)" },
] as const

const TIME_RANGES = [
  { key: "1M", label: "1M" },
  { key: "3M", label: "3M" },
  { key: "YTD", label: "YTD" },
  { key: "1Y", label: "1Y" },
] as const

type TimeRange = (typeof TIME_RANGES)[number]["key"]

export function BenchmarkComparison({ holdings }: { holdings: Holding[] }) {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("3M")
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(["^GSPC"])
  const [chartData, setChartData] = useState<Record<string, number | string>[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<{
    portfolio: { returnPct: number }
    benchmarks: Record<string, { returnPct: number }>
  } | null>(null)

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])
  const tickerKey = tickers.join(",")

  const toggleBenchmark = (key: string) => {
    setSelectedBenchmarks((prev) =>
      prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]
    )
  }

  const fetchData = useCallback(async () => {
    if (tickers.length === 0) return
    setLoading(true)
    try {
      // Fetch portfolio + benchmark data in parallel
      const allTickers = [...tickers, ...selectedBenchmarks].join(",")
      const res = await fetch(`/api/stock-prices?tickers=${allTickers}&history=${selectedRange}`)
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      const charts: Record<string, { timestamps: number[]; closes: number[] }> =
        data.charts || {}

      // Build unified timestamps
      const allTimestamps = new Set<number>()
      for (const ticker of [...tickers, ...selectedBenchmarks]) {
        const chart = charts[ticker]
        if (chart) {
          for (const ts of chart.timestamps) allTimestamps.add(ts)
        }
      }
      const sortedTs = Array.from(allTimestamps).sort((a, b) => a - b)
      if (sortedTs.length === 0) {
        setChartData([])
        setLoading(false)
        return
      }

      // Helper: get closest price at or before a timestamp
      const getPrice = (
        chart: { timestamps: number[]; closes: number[] },
        ts: number
      ): number | null => {
        for (let i = chart.timestamps.length - 1; i >= 0; i--) {
          if (chart.timestamps[i] <= ts) return chart.closes[i]
        }
        if (chart.timestamps[0] <= ts + 86400) return chart.closes[0]
        return null
      }

      // Compute portfolio base values
      const totalAlloc = holdings.reduce(
        (s, h) => s + (h.allocation_percent || 0),
        0
      )

      // For each timestamp, compute % return from first value
      const points: Record<string, number | string>[] = []
      let portfolioBase: number | null = null
      const benchmarkBases: Record<string, number | null> = {}

      for (const ts of sortedTs) {
        const d = new Date(ts * 1000)
        const label =
          selectedRange === "1M"
            ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
            : selectedRange === "3M"
              ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" })

        // Portfolio value
        let portfolioVal = 0
        let validWeight = 0
        for (const holding of holdings) {
          const chart = charts[holding.ticker]
          if (!chart) continue
          const alloc = holding.allocation_percent || 0
          const weight = totalAlloc > 0 ? alloc / totalAlloc : 1 / holdings.length
          const price = getPrice(chart, ts)
          if (price !== null) {
            const basePrice = chart.closes[0]
            if (basePrice > 0) {
              const shares = (10000 * weight) / basePrice
              portfolioVal += price * shares
            }
            validWeight += weight
          }
        }

        if (validWeight === 0) continue

        if (portfolioBase === null) portfolioBase = portfolioVal
        const portfolioReturn =
          portfolioBase > 0
            ? ((portfolioVal - portfolioBase) / portfolioBase) * 100
            : 0

        const point: Record<string, number | string> = {
          label,
          Portfolio: Math.round(portfolioReturn * 100) / 100,
        }

        // Benchmark values
        for (const bm of selectedBenchmarks) {
          const chart = charts[bm]
          if (!chart) continue
          const price = getPrice(chart, ts)
          if (price !== null) {
            if (benchmarkBases[bm] == null) benchmarkBases[bm] = price
            const bmBase = benchmarkBases[bm]!
            const bmReturn =
              bmBase > 0 ? ((price - bmBase) / bmBase) * 100 : 0
            const bmLabel =
              BENCHMARKS.find((b) => b.key === bm)?.label || bm
            point[bmLabel] = Math.round(bmReturn * 100) / 100
          }
        }

        points.push(point)
      }

      // Downsample
      const maxPts = 40
      const sampled =
        points.length > maxPts
          ? points.filter(
              (_, i) =>
                i % Math.ceil(points.length / maxPts) === 0 ||
                i === points.length - 1
            )
          : points

      setChartData(sampled)

      // Compute stats
      if (sampled.length > 1) {
        const last = sampled[sampled.length - 1]
        const portfolioReturnFinal = (last.Portfolio as number) || 0
        const bmStats: Record<string, { returnPct: number }> = {}
        for (const bm of selectedBenchmarks) {
          const bmLabel =
            BENCHMARKS.find((b) => b.key === bm)?.label || bm
          bmStats[bmLabel] = {
            returnPct: (last[bmLabel] as number) || 0,
          }
        }
        setStats({
          portfolio: { returnPct: portfolioReturnFinal },
          benchmarks: bmStats,
        })
      }
    } catch {
      setChartData([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [tickerKey, selectedRange, selectedBenchmarks])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (holdings.length === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Benchmark Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add holdings to compare against market benchmarks.
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
              <BarChart3 className="h-4 w-4 text-primary" />
              Portfolio vs Benchmark
              {loading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Cumulative % return comparison
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Benchmark toggles */}
            {BENCHMARKS.map((bm) => (
              <button
                key={bm.key}
                type="button"
                onClick={() => toggleBenchmark(bm.key)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-200 ${
                  selectedBenchmarks.includes(bm.key)
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-border/80"
                }`}
              >
                {bm.label}
              </button>
            ))}
            <div className="h-4 w-px bg-border mx-1" />
            {/* Time range */}
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
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats row */}
        {stats && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: "hsl(217, 91%, 60%)" }}
              />
              <span className="text-xs text-muted-foreground">Portfolio</span>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  stats.portfolio.returnPct >= 0
                    ? "text-emerald-400"
                    : "text-red-400"
                }`}
              >
                {stats.portfolio.returnPct >= 0 ? "+" : ""}
                {stats.portfolio.returnPct.toFixed(2)}%
              </span>
            </div>
            {Object.entries(stats.benchmarks).map(([label, val]) => {
              const bm = BENCHMARKS.find((b) => b.label === label)
              return (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30"
                >
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: bm?.color || "hsl(0,0%,50%)" }}
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${
                      val.returnPct >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {val.returnPct >= 0 ? "+" : ""}
                    {val.returnPct.toFixed(2)}%
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Chart */}
        {loading && chartData.length === 0 ? (
          <div className="h-56 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs">Loading comparison data...</span>
            </div>
          </div>
        ) : chartData.length > 1 ? (
          <div className="h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 4, right: 4, left: 4, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(217, 33%, 17%)"
                  strokeOpacity={0.4}
                />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(215, 20%, 50%)" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "hsl(215, 20%, 50%)" }}
                  axisLine={false}
                  tickLine={false}
                  width={50}
                  tickFormatter={(v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 11%)",
                    border: "1px solid hsl(217, 33%, 20%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 98%)",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                  formatter={(value: number, name: string) => [
                    `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
                    name,
                  ]}
                  labelStyle={{
                    color: "hsl(215, 20%, 65%)",
                    fontSize: "11px",
                    marginBottom: "4px",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                {/* Reference line at 0 */}
                <Line
                  type="monotone"
                  dataKey="Portfolio"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                  animationDuration={600}
                />
                {selectedBenchmarks.map((bmKey) => {
                  const bm = BENCHMARKS.find((b) => b.key === bmKey)
                  if (!bm) return null
                  return (
                    <Line
                      key={bmKey}
                      type="monotone"
                      dataKey={bm.label}
                      stroke={bm.color}
                      strokeWidth={1.5}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 3 }}
                      animationDuration={600}
                    />
                  )
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-56 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <BarChart3 className="h-6 w-6 opacity-40" />
              <span className="text-sm">No data available</span>
              <button
                type="button"
                onClick={fetchData}
                className="text-xs flex items-center gap-1 text-primary hover:underline mt-1"
              >
                <RefreshCw className="h-3 w-3" /> Retry
              </button>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/20 border border-border/40">
          <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground leading-relaxed">
            <p>
              For informational and educational purposes only. Past performance
              is not indicative of future results.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
