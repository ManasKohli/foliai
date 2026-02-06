"use client"

import { useEffect, useState, useCallback } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, Shield, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ── Fear & Greed approximation ── */
// We compute a simple fear/greed score from VIX + S&P distance from 200d MA
function computeFearGreed(vix: number, spDistFrom200: number): { score: number; label: string } {
  // VIX contribution: VIX 12 = extreme greed, VIX 35+ = extreme fear
  const vixScore = Math.max(0, Math.min(100, 100 - ((vix - 12) / 23) * 100))
  // S&P distance from 200d MA: +15% = extreme greed, -15% = extreme fear
  const maScore = Math.max(0, Math.min(100, 50 + (spDistFrom200 / 15) * 50))
  const score = Math.round(vixScore * 0.6 + maScore * 0.4)
  let label = "Neutral"
  if (score >= 80) label = "Extreme Greed"
  else if (score >= 60) label = "Greed"
  else if (score >= 40) label = "Neutral"
  else if (score >= 20) label = "Fear"
  else label = "Extreme Fear"
  return { score, label }
}

function FearGreedGauge({ score, label }: { score: number; label: string }) {
  const color =
    score >= 70
      ? "text-emerald-400"
      : score >= 40
        ? "text-yellow-400"
        : "text-red-400"
  const bgColor =
    score >= 70
      ? "bg-emerald-400"
      : score >= 40
        ? "bg-yellow-400"
        : "bg-red-400"

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-32 w-32">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 251.3} 251.3`}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-bold", color)}>{score}</span>
        </div>
      </div>
      <div className="text-center">
        <p className={cn("text-sm font-semibold", color)}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Fear & Greed Index</p>
      </div>
    </div>
  )
}

/* ── Long-term chart with simple MA overlay ── */
type ChartPoint = { date: string; value: number; ma50?: number; ma200?: number }

function LongTermChart({
  title,
  subtitle,
  data,
  color,
  yFormat,
}: {
  title: string
  subtitle: string
  data: ChartPoint[]
  color: string
  yFormat?: (v: number) => string
}) {
  if (data.length < 2) {
    return (
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  const values = data.map((d) => d.value).filter((v) => v > 0)
  const allVals = [
    ...values,
    ...data.map((d) => d.ma50).filter((v): v is number => v != null && v > 0),
    ...data.map((d) => d.ma200).filter((v): v is number => v != null && v > 0),
  ]
  const min = Math.min(...allVals)
  const max = Math.max(...allVals)
  const pad = (max - min) * 0.05 || 1
  const latest = values[values.length - 1]
  const first = values[0]
  const changePct = first > 0 ? ((latest - first) / first) * 100 : 0
  const dir = changePct > 0 ? "up" : changePct < 0 ? "down" : "flat"

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-mono font-semibold">{yFormat ? yFormat(latest) : latest.toFixed(2)}</p>
            <p className={cn("text-xs font-medium", dir === "up" ? "text-emerald-400" : dir === "down" ? "text-red-400" : "text-muted-foreground")}>
              {changePct >= 0 ? "+" : ""}{changePct.toFixed(2)}% (1Y)
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id={`ltg-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={yFormat || ((v: number) => v.toFixed(0))}
              width={55}
            />
            <Tooltip
              content={({ active, payload, label: tooltipLabel }) => {
                if (!active || !payload?.length) return null
                return (
                  <div className="rounded-lg bg-popover px-3 py-2 text-xs text-popover-foreground shadow-lg border border-border">
                    <p className="font-medium mb-1">{tooltipLabel}</p>
                    {payload.map((entry) => (
                      <p key={entry.dataKey as string} style={{ color: entry.color }}>
                        {entry.dataKey === "value" ? "Price" : entry.dataKey === "ma50" ? "50-day MA" : "200-day MA"}:{" "}
                        {yFormat ? yFormat(Number(entry.value)) : Number(entry.value).toFixed(2)}
                      </p>
                    ))}
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#ltg-${title})`}
              dot={false}
              isAnimationActive={false}
            />
            <Line type="monotone" dataKey="ma50" stroke="hsl(38, 92%, 50%)" strokeWidth={1} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="ma200" stroke="hsl(280, 70%, 60%)" strokeWidth={1} strokeDasharray="6 3" dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded" style={{ backgroundColor: color }} />
            <span>Price</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded bg-yellow-500" style={{ borderTop: "2px dashed hsl(38, 92%, 50%)" }} />
            <span>50-day MA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 rounded" style={{ backgroundColor: "hsl(280, 70%, 60%)" }} />
            <span>200-day MA</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── Yield Curve Card ── */
function YieldCurveCard({ yields }: { yields: Record<string, number> }) {
  const maturities = [
    { key: "^IRX", label: "3M" },
    { key: "^FVX", label: "5Y" },
    { key: "^TNX", label: "10Y" },
    { key: "^TYX", label: "30Y" },
  ]
  const data = maturities
    .filter((m) => yields[m.key] > 0)
    .map((m) => ({ maturity: m.label, yield: yields[m.key] }))

  const isInverted = (yields["^IRX"] || 0) > (yields["^TNX"] || 0)

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Yield Curve</CardTitle>
            <p className="text-xs text-muted-foreground">Current US Treasury yield curve snapshot</p>
          </div>
          {data.length > 0 && (
            <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium", isInverted ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400")}>
              {isInverted ? <AlertTriangle className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
              {isInverted ? "Inverted" : "Normal"}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length < 2 ? (
          <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">Loading yield data...</div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isInverted ? "hsl(0, 84%, 60%)" : "hsl(217, 91%, 60%)"} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isInverted ? "hsl(0, 84%, 60%)" : "hsl(217, 91%, 60%)"} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
              <XAxis dataKey="maturity" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v.toFixed(1)}%`} width={45} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null
                  return (
                    <div className="rounded-md bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md border border-border">
                      {payload[0].payload.maturity}: {Number(payload[0].value).toFixed(3)}%
                    </div>
                  )
                }}
              />
              <Area
                type="monotone"
                dataKey="yield"
                stroke={isInverted ? "hsl(0, 84%, 60%)" : "hsl(217, 91%, 60%)"}
                strokeWidth={2}
                fill="url(#yieldGrad)"
                dot={{ r: 4, fill: "hsl(var(--background))", stroke: isInverted ? "hsl(0, 84%, 60%)" : "hsl(217, 91%, 60%)", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

/* ── rate expectations card ── */
function RateExpectationsCard({ threeMonth, tenYear }: { threeMonth: number; tenYear: number }) {
  // 3-month T-bill is a proxy for where the market expects the Fed Funds rate to be
  const spread = tenYear - threeMonth
  const expectingCuts = spread < 0

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Rate Expectations</CardTitle>
        <p className="text-xs text-muted-foreground">What the bond market is telling us about rate direction</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Short-end (3M)</p>
            <p className="text-lg font-mono font-semibold">{threeMonth > 0 ? `${threeMonth.toFixed(3)}%` : "..."}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fed funds proxy</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Long-end (10Y)</p>
            <p className="text-lg font-mono font-semibold">{tenYear > 0 ? `${tenYear.toFixed(3)}%` : "..."}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Growth + inflation expectations</p>
          </div>
        </div>
        <div className="rounded-lg border border-border/60 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">3M-10Y Spread</p>
            <p className={cn("text-sm font-mono font-semibold", spread > 0 ? "text-emerald-400" : "text-red-400")}>
              {spread >= 0 ? "+" : ""}{spread.toFixed(2)}%
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {expectingCuts
              ? "Negative spread signals the market may be pricing in rate cuts or economic slowdown"
              : "Positive spread suggests a normal rate environment with growth expectations"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

/* ── VIX snapshot ── */
function VixCard({ vix, vixChart }: { vix: QuoteData | null; vixChart: ChartPoint[] }) {
  const level = vix
    ? vix.price < 15
      ? "Low Volatility"
      : vix.price < 25
        ? "Moderate"
        : vix.price < 35
          ? "Elevated"
          : "Extreme"
    : ""
  const levelColor = vix
    ? vix.price < 15
      ? "text-emerald-400"
      : vix.price < 25
        ? "text-yellow-400"
        : "text-red-400"
    : ""

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              VIX Volatility Index
            </CardTitle>
            <p className="text-xs text-muted-foreground">{"The market's \"fear gauge\""}</p>
          </div>
          {vix && (
            <div className="text-right">
              <p className="text-xl font-mono font-bold">{vix.price.toFixed(2)}</p>
              <p className={cn("text-xs font-medium", levelColor)}>{level}</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {vixChart.length > 1 ? (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={vixChart} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
              <defs>
                <linearGradient id="vixGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide />
              <XAxis dataKey="date" hide />
              <Area type="monotone" dataKey="value" stroke="hsl(0, 84%, 60%)" strokeWidth={1.5} fill="url(#vixGrad)" dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-20 flex items-center justify-center text-xs text-muted-foreground">Loading...</div>
        )}
      </CardContent>
    </Card>
  )
}

type QuoteData = {
  price: number
  change: number
  changePercent: number
  previousClose: number
  name: string
  currency: string
}

/* ── Main Macro Outlook ── */
export function MacroOutlook() {
  const [loading, setLoading] = useState(true)
  const [yields, setYields] = useState<Record<string, number>>({})
  const [vix, setVix] = useState<QuoteData | null>(null)
  const [vixChart, setVixChart] = useState<ChartPoint[]>([])
  const [spChart, setSpChart] = useState<ChartPoint[]>([])
  const [nasdaqChart, setNasdaqChart] = useState<ChartPoint[]>([])
  const [dxyChart, setDxyChart] = useState<ChartPoint[]>([])
  const [goldChart, setGoldChart] = useState<ChartPoint[]>([])
  const [tenYChart, setTenYChart] = useState<ChartPoint[]>([])
  const [fearGreed, setFearGreed] = useState<{ score: number; label: string }>({ score: 50, label: "Neutral" })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch yields + VIX quotes
      const yieldTickers = "^IRX,^FVX,^TNX,^TYX,^VIX"
      const ltTickers = "^GSPC,^IXIC,DX-Y.NYB,GC=F,^TNX,^VIX"

      const [quotesRes, ltHistRes] = await Promise.all([
        fetch(`/api/stock-prices?tickers=${encodeURIComponent(yieldTickers)}`),
        fetch(`/api/stock-prices?tickers=${encodeURIComponent(ltTickers)}&history=1Y`),
      ])

      if (quotesRes.ok) {
        const qData = await quotesRes.json()
        const q = qData.quotes || {}
        const yMap: Record<string, number> = {}
        for (const t of ["^IRX", "^FVX", "^TNX", "^TYX"]) {
          yMap[t] = q[t]?.price || 0
        }
        setYields(yMap)
        if (q["^VIX"]) setVix(q["^VIX"])

        // Compute fear & greed from VIX
        const vixPrice = q["^VIX"]?.price || 20
        // We'll compute S&P distance from 200d MA below
        setFearGreed(computeFearGreed(vixPrice, 0))
      }

      if (ltHistRes.ok) {
        const hData = await ltHistRes.json()
        const rawCharts = hData.charts || {}

        function toChartPoints(ticker: string): ChartPoint[] {
          const c = rawCharts[ticker]
          if (!c) return []
          const { timestamps, closes } = c as { timestamps: number[]; closes: number[] }
          return timestamps.map((ts: number, i: number) => ({
            date: new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            value: closes[i],
          }))
        }

        // Add moving averages to S&P chart
        const spRaw = toChartPoints("^GSPC")
        const spWithMA = addMovingAverages(spRaw)
        setSpChart(spWithMA)

        // Compute fear & greed with SP 200d MA distance
        if (spRaw.length >= 200) {
          const recent = spRaw[spRaw.length - 1].value
          const ma200 = spRaw.slice(-200).reduce((s, d) => s + d.value, 0) / 200
          const distPct = ((recent - ma200) / ma200) * 100
          const vixPrice = vix?.price || 20
          setFearGreed(computeFearGreed(vixPrice, distPct))
        }

        setNasdaqChart(addMovingAverages(toChartPoints("^IXIC")))
        setDxyChart(addMovingAverages(toChartPoints("DX-Y.NYB")))
        setGoldChart(addMovingAverages(toChartPoints("GC=F")))
        setTenYChart(addMovingAverages(toChartPoints("^TNX")))
        setVixChart(toChartPoints("^VIX"))
      }
    } catch (e) {
      console.error("[v0] MacroOutlook fetch error:", e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">1-year view with 50-day and 200-day moving averages</p>
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading} className="gap-1.5 text-xs">
          <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Top row: Fear & Greed + VIX + Yield Curve + Rate Expectations */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="pt-6 flex items-center justify-center">
            <FearGreedGauge score={fearGreed.score} label={fearGreed.label} />
          </CardContent>
        </Card>
        <VixCard vix={vix} vixChart={vixChart} />
        <YieldCurveCard yields={yields} />
        <RateExpectationsCard threeMonth={yields["^IRX"] || 0} tenYear={yields["^TNX"] || 0} />
      </div>

      {/* Long-term charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LongTermChart
          title="S&P 500"
          subtitle="Large-cap US equities benchmark"
          data={spChart}
          color="hsl(217, 91%, 60%)"
          yFormat={(v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        />
        <LongTermChart
          title="Nasdaq 100"
          subtitle="Technology and growth-heavy index"
          data={nasdaqChart}
          color="hsl(172, 66%, 50%)"
          yFormat={(v) => v.toLocaleString("en-US", { maximumFractionDigits: 0 })}
        />
        <LongTermChart
          title="Gold"
          subtitle="Safe-haven asset and inflation hedge"
          data={goldChart}
          color="hsl(38, 92%, 50%)"
          yFormat={(v) => `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
        />
        <LongTermChart
          title="US Dollar Index (DXY)"
          subtitle="Dollar strength vs basket of major currencies"
          data={dxyChart}
          color="hsl(142, 71%, 45%)"
        />
        <LongTermChart
          title="10-Year Treasury Yield"
          subtitle="The most important rate in global finance -- growth, inflation, and geopolitical risk"
          data={tenYChart}
          color="hsl(0, 84%, 60%)"
          yFormat={(v) => `${v.toFixed(2)}%`}
        />
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Data from Yahoo Finance. Moving averages computed from available daily close data. For educational and informational purposes only.
      </p>
    </div>
  )
}

function addMovingAverages(data: ChartPoint[]): ChartPoint[] {
  return data.map((point, idx) => {
    let ma50: number | undefined
    let ma200: number | undefined
    if (idx >= 49) {
      const slice = data.slice(idx - 49, idx + 1)
      ma50 = slice.reduce((s, d) => s + d.value, 0) / 50
    }
    if (idx >= 199) {
      const slice = data.slice(idx - 199, idx + 1)
      ma200 = slice.reduce((s, d) => s + d.value, 0) / 200
    }
    return { ...point, ma50, ma200 }
  })
}
