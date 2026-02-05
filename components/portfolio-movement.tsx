"use client"

import { useMemo, useState, useEffect } from "react"
import { Activity, TrendingDown, TrendingUp, Building2, Briefcase, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function PortfolioMovement({ holdings }: { holdings: Holding[] }) {
  const [prices, setPrices] = useState<Record<string, PriceData>>({})
  const [loading, setLoading] = useState(true)

  const etfCount = holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker)).length
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
  const techExposure = effectiveExposure["Technology"] || 0
  const hasTech = techExposure > 0

  // Find best and worst performers from real prices
  const movers = useMemo(() => {
    const withPrices = holdings
      .filter((h) => prices[h.ticker])
      .map((h) => ({
        ticker: h.ticker,
        changePercent: prices[h.ticker].changePercent,
        name: prices[h.ticker].name,
      }))
      .sort((a, b) => b.changePercent - a.changePercent)

    return {
      best: withPrices[0],
      worst: withPrices[withPrices.length - 1],
      avgChange: withPrices.length > 0
        ? withPrices.reduce((s, m) => s + m.changePercent, 0) / withPrices.length
        : 0,
    }
  }, [holdings, prices])

  if (holdings.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Why did my portfolio move?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add holdings to see movement explanations.
          </p>
        </CardContent>
      </Card>
    )
  }

  const marketUp = movers.avgChange >= 0

  const movements = [
    {
      icon: marketUp ? TrendingUp : TrendingDown,
      title: "Market Movement",
      description: loading
        ? "Loading real-time market data..."
        : Object.keys(prices).length > 0
          ? `Your holdings averaged ${movers.avgChange >= 0 ? "+" : ""}${movers.avgChange.toFixed(2)}% today.${movers.best && movers.worst && movers.best.ticker !== movers.worst.ticker ? ` Best: ${movers.best.ticker} (${movers.best.changePercent >= 0 ? "+" : ""}${movers.best.changePercent.toFixed(2)}%), Worst: ${movers.worst.ticker} (${movers.worst.changePercent >= 0 ? "+" : ""}${movers.worst.changePercent.toFixed(2)}%).` : ""}`
          : "Could not fetch live prices. Check your holdings for updates.",
      color: marketUp ? "text-emerald-400" : "text-red-400",
    },
    {
      icon: Building2,
      title: "Sector Movement",
      description: hasTech
        ? `Technology (${techExposure.toFixed(1)}% of your effective exposure${etfCount > 0 ? ", including through ETFs" : ""}) is your largest sector bet. ${techExposure > 30 ? "Rate-sensitive with this much tech." : ""}`
        : `${dominantSector?.[0] || "Your sectors"} at ${dominantSector?.[1]?.toFixed(1)}% effective exposure is your top sector.`,
      color: "text-chart-4",
    },
    {
      icon: Briefcase,
      title: "Holdings Impact",
      description: etfCount > 0
        ? `Your ${holdings.length} positions (${etfCount} ETF${etfCount !== 1 ? "s" : ""}) provide diversified exposure across ${sortedSectors.length} sectors, helping limit portfolio impact.`
        : holdings.length > 3
          ? `Your ${holdings.length} holdings are reacting to sector trends. Diversification is helping limit overall portfolio impact.`
          : "With concentrated positions, your portfolio is more sensitive to individual stock movements.",
      color: "text-chart-1",
    },
  ]

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Why did my portfolio move?
          </CardTitle>
          {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {movements.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 p-3 rounded-lg transition-all duration-300 hover:bg-muted/30 hover:translate-x-1 cursor-default"
          >
            <div className={`p-2 rounded-lg bg-muted/50 h-fit ${item.color} transition-transform duration-300`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground">{item.title}</h4>
              <p className="text-sm text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
