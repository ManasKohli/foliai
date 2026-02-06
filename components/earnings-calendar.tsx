"use client"

import { useState, useEffect, useMemo } from "react"
import { Calendar, Loader2, TrendingUp, TrendingDown, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isKnownETF } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  quantity: number | null
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface EarningsInfo {
  ticker: string
  name: string
  earningsDate: string
  earningsDateEnd?: string
  eps?: number | null
  changePercent?: number
  price?: number
}

export function EarningsCalendar({ holdings }: { holdings: Holding[] }) {
  const [earnings, setEarnings] = useState<EarningsInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [noEarningsStocks, setNoEarningsStocks] = useState<string[]>([])

  // Only check stocks, not ETFs
  const stockTickers = useMemo(
    () => holdings.filter((h) => h.holding_type !== "etf" && !isKnownETF(h.ticker)).map((h) => h.ticker),
    [holdings],
  )

  useEffect(() => {
    if (stockTickers.length === 0) {
      setLoading(false)
      return
    }

    const fetchEarnings = async () => {
      setLoading(true)
      const results: EarningsInfo[] = []
      const noData: string[] = []

      // Fetch all stock details in parallel using the stock-detail API
      // which now uses the working v7/finance/quote endpoint
      const settled = await Promise.allSettled(
        stockTickers.map(async (ticker) => {
          const res = await fetch(`/api/stock-detail?ticker=${encodeURIComponent(ticker)}`)
          if (!res.ok) return { ticker, quote: null }
          const data = await res.json()
          return { ticker, quote: data.quote }
        }),
      )

      for (const result of settled) {
        if (result.status === "rejected") continue
        const { ticker, quote } = result.value
        if (!quote) {
          noData.push(ticker)
          continue
        }

        if (quote.earningsDate) {
          results.push({
            ticker,
            name: quote.name || ticker,
            earningsDate: quote.earningsDate,
            earningsDateEnd: quote.earningsDateEnd || undefined,
            eps: quote.eps,
            changePercent: quote.changePercent,
            price: quote.price,
          })
        } else {
          noData.push(ticker)
        }
      }

      // Sort by date: soonest first
      results.sort((a, b) => new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime())
      setEarnings(results)
      setNoEarningsStocks(noData)
      setLoading(false)
    }
    fetchEarnings()
  }, [stockTickers])

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const upcomingEarnings = earnings.filter((e) => new Date(e.earningsDate) >= today)
  const pastEarnings = earnings.filter((e) => new Date(e.earningsDate) < today)

  if (stockTickers.length === 0) {
    return null
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Earnings Calendar
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Next earnings reports for your stocks
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Fetching earnings for {stockTickers.length} stock{stockTickers.length !== 1 ? "s" : ""}...
            </span>
          </div>
        ) : earnings.length === 0 ? (
          <div className="text-center py-6 space-y-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground/50 mx-auto" />
            <p className="text-sm text-muted-foreground">
              No earnings dates available for your stocks right now.
            </p>
            {noEarningsStocks.length > 0 && (
              <p className="text-xs text-muted-foreground/70">
                Checked: {noEarningsStocks.join(", ")}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Upcoming */}
            {upcomingEarnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Upcoming</p>
                {upcomingEarnings.map((e) => (
                  <EarningsRow key={e.ticker} earnings={e} isUpcoming />
                ))}
              </div>
            )}

            {/* Past */}
            {pastEarnings.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recently Reported</p>
                {pastEarnings.slice(-5).map((e) => (
                  <EarningsRow key={e.ticker} earnings={e} isUpcoming={false} />
                ))}
              </div>
            )}

            {/* Stocks without earnings data */}
            {noEarningsStocks.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground/70">
                  No scheduled date: {noEarningsStocks.join(", ")}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function EarningsRow({ earnings, isUpcoming }: { earnings: EarningsInfo; isUpcoming: boolean }) {
  const earningsDate = new Date(earnings.earningsDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((earningsDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const isUp = (earnings.changePercent || 0) > 0

  // Show date range if available
  const dateStr = earningsDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: earningsDate.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  })
  const endDate = earnings.earningsDateEnd ? new Date(earnings.earningsDateEnd) : null
  const endDateStr = endDate && endDate.getTime() !== earningsDate.getTime()
    ? ` - ${endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : ""

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
      {/* Date badge */}
      <div
        className={`flex flex-col items-center justify-center min-w-[48px] px-2 py-1.5 rounded-md ${
          isUpcoming
            ? diffDays <= 7
              ? "bg-primary/15 text-primary"
              : diffDays <= 30
                ? "bg-muted/60 text-foreground"
                : "bg-muted/40 text-muted-foreground"
            : "bg-muted/30 text-muted-foreground/70"
        }`}
      >
        <span className="text-xs font-bold uppercase">
          {earningsDate.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-lg font-bold leading-tight">{earningsDate.getDate()}</span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{earnings.ticker}</span>
          {isUpcoming && diffDays <= 14 && (
            <Badge
              variant="outline"
              className={`text-xs px-1 py-0 h-4 ${
                diffDays <= 3
                  ? "border-primary/40 text-primary bg-primary/5"
                  : "border-border/50 text-muted-foreground"
              }`}
            >
              <Clock className="h-2.5 w-2.5 mr-0.5" />
              {diffDays === 0 ? "Today" : diffDays === 1 ? "Tomorrow" : `${diffDays}d`}
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground truncate block">{earnings.name}</span>
        <span className="text-xs text-muted-foreground/70">{dateStr}{endDateStr}</span>
      </div>

      {/* Right side stats */}
      <div className="text-right flex-shrink-0 space-y-0.5">
        {earnings.price != null && (
          <div className="text-xs text-muted-foreground tabular-nums">
            ${earnings.price.toFixed(2)}
          </div>
        )}
        {earnings.eps != null && (
          <div className="text-xs text-muted-foreground">
            EPS: <span className="font-medium text-foreground">${earnings.eps.toFixed(2)}</span>
          </div>
        )}
        {earnings.changePercent != null && (
          <div
            className={`flex items-center justify-end gap-0.5 text-xs ${isUp ? "text-emerald-400" : "text-red-400"}`}
          >
            {isUp ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {isUp ? "+" : ""}
            {earnings.changePercent.toFixed(2)}%
          </div>
        )}
      </div>
    </div>
  )
}
