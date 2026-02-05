"use client"

import { useMemo, useState, useEffect } from "react"
import { Shield, Globe, Target, Activity, Loader2, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { calculateEffectiveSectorExposure, isKnownETF, getExchange } from "@/lib/etf-data"

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

export function PortfolioHealth({ holdings }: { holdings: Holding[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [loading, setLoading] = useState(true)

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  useEffect(() => {
    if (tickers.length === 0) {
      setLoading(false)
      return
    }
    const fetchPrices = async () => {
      try {
        const res = await fetch(`/api/stock-prices?tickers=${tickers.join(",")}`)
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
  }, [tickers])

  // Sector allocation
  const effectiveExposure = useMemo(() => {
    const holdingsForCalc = holdings
      .filter((h) => h.allocation_percent && h.allocation_percent > 0)
      .map((h) => ({
        ticker: h.ticker,
        allocation_percent: h.allocation_percent || 0,
        holding_type: h.holding_type || (isKnownETF(h.ticker) ? "etf" : "stock"),
        sector: h.sector,
      }))
    return calculateEffectiveSectorExposure(holdingsForCalc)
  }, [holdings])

  const sortedSectors = Object.entries(effectiveExposure).sort((a, b) => b[1] - a[1])

  // Geographic exposure
  const geoExposure = useMemo(() => {
    let usExposure = 0
    let cadExposure = 0
    let intlExposure = 0

    for (const h of holdings) {
      const alloc = h.allocation_percent || 0
      const exchange = getExchange(h.ticker)
      if (exchange === "TSX") {
        cadExposure += alloc
      } else if (exchange === "NYSE" || exchange === "NASDAQ") {
        usExposure += alloc
      } else {
        intlExposure += alloc
      }
    }
    const total = usExposure + cadExposure + intlExposure
    return {
      US: total > 0 ? (usExposure / total) * 100 : 0,
      Canada: total > 0 ? (cadExposure / total) * 100 : 0,
      International: total > 0 ? (intlExposure / total) * 100 : 0,
    }
  }, [holdings])

  // Concentration metrics
  const concentration = useMemo(() => {
    const sorted = [...holdings]
      .sort((a, b) => (b.allocation_percent || 0) - (a.allocation_percent || 0))

    const top3 = sorted.slice(0, 3)
    const top3Pct = top3.reduce((s, h) => s + (h.allocation_percent || 0), 0)
    const totalAlloc = holdings.reduce((s, h) => s + (h.allocation_percent || 0), 0)
    const top3Ratio = totalAlloc > 0 ? (top3Pct / totalAlloc) * 100 : 0

    const maxHolding = sorted[0]
    const maxPct = maxHolding ? (maxHolding.allocation_percent || 0) : 0
    const maxRatio = totalAlloc > 0 ? (maxPct / totalAlloc) * 100 : 0

    // Herfindahl-Hirschman Index (simplified)
    let hhi = 0
    for (const h of holdings) {
      const weight = totalAlloc > 0 ? ((h.allocation_percent || 0) / totalAlloc) * 100 : 0
      hhi += weight * weight
    }

    return {
      top3,
      top3Ratio,
      maxHolding: maxHolding?.ticker || "N/A",
      maxRatio,
      hhi,
      holdingCount: holdings.length,
    }
  }, [holdings])

  // Volatility estimate from daily change spread
  const volatilityMetrics = useMemo(() => {
    const changes = holdings
      .filter((h) => prices[h.ticker])
      .map((h) => prices[h.ticker].changePercent)

    if (changes.length === 0) return null

    const avg = changes.reduce((s, c) => s + c, 0) / changes.length
    const variance =
      changes.reduce((s, c) => s + (c - avg) ** 2, 0) / changes.length
    const spread = Math.sqrt(variance)

    // Max drawdown proxy from single-day data
    const worstChange = Math.min(...changes)
    const bestChange = Math.max(...changes)

    return {
      avgDailyChange: avg,
      spreadOfReturns: spread,
      worstToday: worstChange,
      bestToday: bestChange,
    }
  }, [holdings, prices])

  if (holdings.length === 0) {
    return (
      <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Portfolio Structure & Risk
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Add holdings to see structural analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Portfolio Structure & Risk
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Structural analysis of your portfolio. Neutral observations only.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sector Allocation */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-chart-1" />
            <span className="text-sm font-medium text-foreground">
              Sector Allocation
            </span>
          </div>
          <div className="space-y-2">
            {sortedSectors.slice(0, 5).map(([sector, pct]) => (
              <div key={sector} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{sector}</span>
                  <span className="text-xs font-medium text-foreground tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(pct, 100)}
                  className="h-1.5"
                />
              </div>
            ))}
            {sortedSectors.length > 5 && (
              <p className="text-xs text-muted-foreground">
                +{sortedSectors.length - 5} more sectors
              </p>
            )}
          </div>
        </div>

        {/* Geographic Exposure */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-chart-2" />
            <span className="text-sm font-medium text-foreground">
              Geographic Exposure
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(geoExposure)
              .filter(([, pct]) => pct > 0)
              .map(([region, pct]) => (
                <div
                  key={region}
                  className="p-2.5 rounded-lg bg-muted/30 text-center"
                >
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {pct.toFixed(0)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{region}</p>
                </div>
              ))}
          </div>
        </div>

        {/* Concentration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-chart-4" />
            <span className="text-sm font-medium text-foreground">
              Concentration
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">
                Largest holding
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {concentration.maxHolding}
                </Badge>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    concentration.maxRatio > 30
                      ? "text-chart-4"
                      : "text-foreground"
                  }`}
                >
                  {concentration.maxRatio.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
              <span className="text-xs text-muted-foreground">
                Top 3 holdings
              </span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {concentration.top3.map((h) => (
                    <Badge
                      key={h.id}
                      variant="outline"
                      className="text-xs px-1"
                    >
                      {h.ticker}
                    </Badge>
                  ))}
                </div>
                <span
                  className={`text-xs font-semibold tabular-nums ${
                    concentration.top3Ratio > 70
                      ? "text-chart-4"
                      : "text-foreground"
                  }`}
                >
                  {concentration.top3Ratio.toFixed(1)}%
                </span>
              </div>
            </div>
            {concentration.top3Ratio > 70 && (
              <div className="flex items-start gap-2 p-2 rounded-md bg-chart-4/5 border border-chart-4/10">
                <AlertTriangle className="h-3.5 w-3.5 text-chart-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  High concentration detected: top 3 positions represent{" "}
                  {concentration.top3Ratio.toFixed(0)}% of the portfolio.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Volatility metrics */}
        {volatilityMetrics && !loading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-chart-5" />
              <span className="text-sm font-medium text-foreground">
                {"Today's"} Volatility Snapshot
              </span>
              {loading && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-lg bg-muted/30 text-center">
                <p className="text-sm font-bold text-foreground tabular-nums">
                  {volatilityMetrics.spreadOfReturns.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">Return Spread</p>
              </div>
              <div className="p-2.5 rounded-lg bg-muted/30 text-center">
                <p
                  className={`text-sm font-bold tabular-nums ${
                    volatilityMetrics.worstToday < -2
                      ? "text-red-400"
                      : "text-foreground"
                  }`}
                >
                  {volatilityMetrics.worstToday.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground">Worst Holding</p>
              </div>
            </div>
          </div>
        )}

        {/* Correlation note */}
        {sortedSectors[0] && sortedSectors[0][1] > 40 && (
          <div className="p-3 rounded-lg bg-muted/20 border border-border/40">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {sortedSectors[0][1].toFixed(0)}% of holdings are correlated with
              the {sortedSectors[0][0].toLowerCase()} sector. This may amplify
              gains and losses when that sector moves.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
