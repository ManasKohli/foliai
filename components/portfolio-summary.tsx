"use client"

import { Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useMemo } from "react"
import { calculateEffectiveSectorExposure, isKnownETF } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

export function PortfolioSummary({ holdings }: { holdings: Holding[] }) {
  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)
  const holdingCount = holdings.length
  const etfCount = holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker)).length
  const stockCount = holdingCount - etfCount

  // Calculate effective sector exposure (sees through ETFs)
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

  // Simulated daily movement
  const dailyChange = -0.8
  const isUp = dailyChange > 0
  const isFlat = dailyChange === 0

  const getSummaryText = () => {
    if (holdingCount === 0) {
      return "Add your holdings to get a personalized daily briefing about your portfolio."
    }

    const movementText = isFlat
      ? "Your portfolio is unchanged today."
      : isUp
        ? `Your portfolio is up ${dailyChange.toFixed(1)}% today.`
        : `Your portfolio is slightly down today (${dailyChange.toFixed(1)}%).`

    const compositionText = etfCount > 0
      ? ` You hold ${stockCount > 0 ? `${stockCount} stock${stockCount !== 1 ? "s" : ""} and ` : ""}${etfCount} ETF${etfCount !== 1 ? "s" : ""} totaling ${totalAllocation.toFixed(0)}% allocated.`
      : ` You hold ${holdingCount} position${holdingCount !== 1 ? "s" : ""} totaling ${totalAllocation.toFixed(0)}% allocated.`

    const sectorText = dominantSector
      ? ` Your largest effective exposure is ${dominantSector[0]} at ${dominantSector[1].toFixed(1)}% of your portfolio${etfCount > 0 ? " (including exposure through ETFs)" : ""}.`
      : ""

    const sensitivityText =
      dominantSector?.[0] === "Technology"
        ? " This makes your portfolio sensitive to interest rate changes and tech sector news."
        : dominantSector?.[0] === "Healthcare"
          ? " This gives you defensive characteristics but exposes you to regulatory news."
          : dominantSector?.[0] === "Financials"
            ? " This makes your portfolio sensitive to rate decisions and banking regulations."
            : dominantSector?.[0] === "Energy"
              ? " This exposes you to oil price swings and geopolitical energy risks."
              : ""

    return movementText + compositionText + sectorText + sensitivityText
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
                <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-chart-3" : isFlat ? "text-muted-foreground" : "text-chart-5"}`}>
                  {isUp ? <TrendingUp className="h-4 w-4" /> : isFlat ? <Minus className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {dailyChange > 0 ? "+" : ""}{dailyChange.toFixed(1)}%
                </div>
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
