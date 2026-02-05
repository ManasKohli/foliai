"use client"

import { useMemo } from "react"
import { Activity, TrendingDown, Building2, Briefcase } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateEffectiveSectorExposure, isKnownETF } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

export function PortfolioMovement({ holdings }: { holdings: Holding[] }) {
  const etfCount = holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker)).length

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

  const movements = [
    {
      icon: TrendingDown,
      title: "Market Movement",
      description: "Broader markets are slightly lower today following mixed economic data and investor caution ahead of upcoming earnings.",
      color: "text-chart-5",
    },
    {
      icon: Building2,
      title: "Sector Movement",
      description: hasTech
        ? `Technology (${techExposure.toFixed(1)}% of your effective exposure${etfCount > 0 ? ", including through ETFs" : ""}) is leading declines. Healthcare is outperforming.`
        : `${dominantSector?.[0] || "Your sectors"} at ${dominantSector?.[1]?.toFixed(1)}% effective exposure is experiencing mild volatility today.`,
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
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Why did my portfolio move?
        </CardTitle>
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
