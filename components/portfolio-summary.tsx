"use client"

import { Sparkles, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useMemo, useState, useEffect } from "react"
import { calculateEffectiveSectorExposure, isKnownETF } from "@/lib/etf-data"

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

export function PortfolioSummary({ holdings }: { holdings: Holding[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [loadingPrices, setLoadingPrices] = useState(true)

  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)
  const holdingCount = holdings.length
  const etfCount = holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker)).length
  const stockCount = holdingCount - etfCount

  const tickers = useMemo(() => holdings.map((h) => h.ticker), [holdings])

  useEffect(() => {
    if (tickers.length === 0) {
      setLoadingPrices(false)
      return
    }
    const fetchPrices = async () => {
      setLoadingPrices(true)
      try {
        const res = await fetch(`/api/stock-prices?tickers=${tickers.join(",")}`)
        if (res.ok) {
          const data = await res.json()
          setPrices(data.quotes || {})
        }
      } catch {
        // stay empty
      } finally {
        setLoadingPrices(false)
      }
    }
    fetchPrices()
    const interval = setInterval(fetchPrices, 120000)
    return () => clearInterval(interval)
  }, [tickers])

  // Calculate real portfolio daily change from live prices
  const portfolioChange = useMemo(() => {
    let totalValue = 0
    let totalPrevValue = 0
    let matchedCount = 0
    const movers: { ticker: string; changePercent: number }[] = []

    for (const h of holdings) {
      const p = prices[h.ticker]
      if (p) {
        matchedCount++
        movers.push({ ticker: h.ticker, changePercent: p.changePercent })
        if (h.quantity) {
          totalValue += p.price * h.quantity
          totalPrevValue += p.previousClose * h.quantity
        }
      }
    }

    // If we have values, use weighted change. Otherwise use average of available changePercent
    let dailyChange = 0
    if (totalPrevValue > 0) {
      dailyChange = ((totalValue - totalPrevValue) / totalPrevValue) * 100
    } else if (matchedCount > 0) {
      // Weight by allocation
      let weightedSum = 0
      let totalWeight = 0
      for (const h of holdings) {
        const p = prices[h.ticker]
        if (p) {
          const weight = h.allocation_percent || (100 / holdings.length)
          weightedSum += p.changePercent * weight
          totalWeight += weight
        }
      }
      dailyChange = totalWeight > 0 ? weightedSum / totalWeight : 0
    }

    // Sort movers by absolute change
    movers.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))

    return { dailyChange, totalValue, totalPrevValue, matchedCount, topMover: movers[0], movers }
  }, [holdings, prices])

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
  const dominantSector = sortedSectors[0]

  const { dailyChange, totalValue, matchedCount } = portfolioChange
  const isUp = dailyChange > 0.01
  const isDown = dailyChange < -0.01
  const isFlat = !isUp && !isDown

  const getSummaryText = () => {
    if (holdingCount === 0) {
      return "Add your holdings to get a personalized daily briefing about your portfolio."
    }

    if (loadingPrices) {
      return "Loading live market data for your portfolio..."
    }

    const movementText = matchedCount > 0
      ? (isFlat
          ? "Your portfolio is roughly flat today."
          : isUp
            ? `Your portfolio is up ${dailyChange.toFixed(2)}% today.`
            : `Your portfolio is down ${Math.abs(dailyChange).toFixed(2)}% today.`)
      : ""

    const valueText = totalValue > 0
      ? ` Total value: $${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`
      : ""

    const compositionText = etfCount > 0
      ? ` You hold ${stockCount > 0 ? `${stockCount} stock${stockCount !== 1 ? "s" : ""} and ` : ""}${etfCount} ETF${etfCount !== 1 ? "s" : ""} totaling ${totalAllocation.toFixed(0)}% allocated.`
      : ` You hold ${holdingCount} position${holdingCount !== 1 ? "s" : ""} totaling ${totalAllocation.toFixed(0)}% allocated.`

    const topMoverText = portfolioChange.topMover && matchedCount > 0
      ? ` Biggest mover: ${portfolioChange.topMover.ticker} (${portfolioChange.topMover.changePercent > 0 ? "+" : ""}${portfolioChange.topMover.changePercent.toFixed(2)}%).`
      : ""

    const sectorText = dominantSector
      ? ` Largest exposure: ${dominantSector[0]} at ${dominantSector[1].toFixed(1)}%.`
      : ""

    return movementText + valueText + compositionText + topMoverText + sectorText
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 group">
          <div className="p-3 rounded-xl bg-primary/10 transition-transform duration-300 group-hover:scale-110">
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{"Today's Portfolio Summary"}</h2>
              {holdingCount > 0 && (
                loadingPrices ? (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span className="text-xs">Live</span>
                  </div>
                ) : matchedCount > 0 ? (
                  <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-emerald-400" : isFlat ? "text-muted-foreground" : "text-red-400"}`}>
                    {isUp ? <TrendingUp className="h-4 w-4" /> : isFlat ? <Minus className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="tabular-nums">{dailyChange > 0 ? "+" : ""}{dailyChange.toFixed(2)}%</span>
                  </div>
                ) : null
              )}
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {getSummaryText()}
            </p>
            {holdingCount > 0 && sortedSectors.length > 1 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {sortedSectors.slice(0, 4).map(([sector, pct]) => (
                  <div key={sector} className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                    {sector} {pct.toFixed(1)}%
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
