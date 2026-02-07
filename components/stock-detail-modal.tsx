"use client"

import { useState, useEffect, useCallback } from "react"
import {
  X,
  TrendingUp,
  TrendingDown,
  Loader2,
  ExternalLink,
  Newspaper,
  BarChart3,
} from "lucide-react"
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

const TABS = [
  { key: "chart", label: "Chart", icon: BarChart3 },
  { key: "news", label: "News", icon: Newspaper },
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

interface QuoteDetail {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  previousClose: number
  open?: number
  dayHigh?: number
  dayLow?: number
  volume?: number
  avgVolume?: number
  marketCap?: number
  currency: string
  exchange?: string
  quoteType?: string
  peRatio?: number | null
  forwardPE?: number | null
  pegRatio?: number | null
  priceToBook?: number | null
  dividendYield?: number | null
  dividendRate?: number | null
  exDividendDate?: string | null
  payoutRatio?: number | null
  fiftyTwoWeekHigh?: number | null
  fiftyTwoWeekLow?: number | null
  fiftyDayAverage?: number | null
  twoHundredDayAverage?: number | null
  beta?: number | null
  eps?: number | null
  forwardEps?: number | null
  profitMargin?: number | null
  earningsDate?: string | null
  earningsDateEnd?: string | null
}

interface NewsItem {
  title: string
  publisher: string
  link: string
  publishedAt: string
  thumbnail?: string
}

export function StockDetailModal({ ticker, name, onClose }: StockDetailModalProps) {
  const [range, setRange] = useState<string>("1M")
  const [tab, setTab] = useState<string>("chart")
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(true)

  // Fetch detailed quote + news
  useEffect(() => {
    async function fetchDetail() {
      setDetailLoading(true)
      try {
        const res = await fetch(`/api/stock-detail?ticker=${encodeURIComponent(ticker)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.quote) setQuote(data.quote)
          if (data.news) setNews(data.news)
        }
      } catch {
        // ignore
      } finally {
        setDetailLoading(false)
      }
    }
    fetchDetail()
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
          const maxPts = range === "1D" ? 78 : range === "1W" ? 50 : 60
          if (points.length > maxPts) {
            const step = Math.ceil(points.length / maxPts)
            const sampled = points.filter((_, i) => i % step === 0)
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
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto z-10 border-border/60 shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
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
                    {quote.changePercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}% today
                  </Badge>
                )}
                {quote?.exchange && (
                  <Badge variant="outline" className="text-xs text-muted-foreground border-border/50">
                    {quote.exchange}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{quote?.name || name}</p>
              {quote && (
                <div className="flex items-baseline gap-3 mt-2">
                  <span className="text-3xl font-bold tabular-nums text-foreground">
                    {quote.currency === "CAD" ? "C" : ""}${quote.price.toFixed(2)}
                  </span>
                  <span className={`text-sm font-medium ${quote.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent >= 0 ? "+" : ""}{quote.changePercent.toFixed(2)}%)
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

          {/* Tabs */}
          <div className="flex gap-1 mb-4 border-b border-border/50 pb-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
                  tab === t.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
                {t.key === "news" && news.length > 0 && (
                  <span className="text-xs opacity-70">({news.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Chart Tab */}
          {tab === "chart" && (
            <div>
              {/* Range buttons */}
              <div className="flex gap-1 mb-4">
                {RANGES.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`px-3 py-1.5 text-sm rounded-md font-medium transition-all duration-200 ${
                      range === r.key
                        ? "bg-muted text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              {/* Range change */}
              {chartData.length > 1 && !loading && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm text-muted-foreground">{range} change:</span>
                  <span className={`text-sm font-semibold ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                    {isUp ? "+" : ""}${rangeChange.toFixed(2)} ({isUp ? "+" : ""}{rangeChangePct.toFixed(2)}%)
                  </span>
                </div>
              )}

              {/* Chart */}
              <div className="h-72 w-full">
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
                        tickFormatter={(v: number) => `$${v.toFixed(v >= 100 ? 0 : 2)}`}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                          fontSize: "13px",
                          color: "hsl(var(--foreground))",
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, ticker]}
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

              {/* Quick stats row */}
              {quote && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-border/50">
                  <StatItem label="Previous Close" value={`$${quote.previousClose.toFixed(2)}`} />
                  {quote.open ? <StatItem label="Open" value={`$${quote.open.toFixed(2)}`} /> : null}
                  {quote.dayHigh ? <StatItem label="Day High" value={`$${quote.dayHigh.toFixed(2)}`} /> : null}
                  {quote.dayLow ? <StatItem label="Day Low" value={`$${quote.dayLow.toFixed(2)}`} /> : null}
                  {quote.volume ? <StatItem label="Volume" value={formatLargeNumber(quote.volume)} /> : null}
                  {quote.marketCap ? <StatItem label="Market Cap" value={formatLargeNumber(quote.marketCap)} /> : null}
                  {quote.fiftyTwoWeekHigh ? <StatItem label="52W High" value={`$${quote.fiftyTwoWeekHigh.toFixed(2)}`} /> : null}
                  {quote.fiftyTwoWeekLow ? <StatItem label="52W Low" value={`$${quote.fiftyTwoWeekLow.toFixed(2)}`} /> : null}
                </div>
              )}
            </div>
          )}

          {/* News Tab */}
          {tab === "news" && (
            <div>
              {detailLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : news.length > 0 ? (
                <div className="space-y-3">
                  {news.map((item, idx) => (
                    <a
                      key={idx}
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors group"
                    >
                      {item.thumbnail && (
                        <img
                          src={item.thumbnail || "/placeholder.svg"}
                          alt=""
                          className="w-16 h-16 rounded-md object-cover flex-shrink-0"
                          crossOrigin="anonymous"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-muted-foreground">{item.publisher}</span>
                          {item.publishedAt && (
                            <>
                              <span className="text-xs text-muted-foreground/50">{"--"}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(item.publishedAt)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary flex-shrink-0 mt-1" />
                    </a>
                  ))}
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No news found for {ticker}.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  )
}

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`
  return num.toLocaleString()
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  if (hours < 1) return "Just now"
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
