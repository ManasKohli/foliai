"use client"

import { Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
}

export function PortfolioSummary({ holdings }: { holdings: Holding[] }) {
  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)
  const sectors = holdings.reduce((acc, h) => {
    const sector = h.sector || "Other"
    acc[sector] = (acc[sector] || 0) + (h.allocation_percent || 0)
    return acc
  }, {} as Record<string, number>)

  const dominantSector = Object.entries(sectors).sort((a, b) => b[1] - a[1])[0]
  const holdingCount = holdings.length

  // Simulated daily movement (in a real app, this would come from market data)
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

    const sectorText = dominantSector
      ? ` Your largest exposure is to ${dominantSector[0].toLowerCase()} stocks (${dominantSector[1].toFixed(0)}% of portfolio).`
      : ""

    const sensitivityText =
      dominantSector?.[0] === "Technology"
        ? " This makes your portfolio sensitive to interest rate changes and tech sector news."
        : dominantSector?.[0] === "Healthcare"
          ? " This gives you defensive characteristics but exposes you to regulatory news."
          : dominantSector?.[0] === "Finance"
            ? " This makes your portfolio sensitive to interest rate decisions and banking regulations."
            : ""

    return movementText + sectorText + sensitivityText
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
              <h2 className="text-lg font-semibold text-foreground">Today&apos;s Portfolio Summary</h2>
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
            {holdingCount > 0 && (
              <p className="text-xs text-muted-foreground/70">
                Insights update as markets change
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
