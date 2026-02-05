"use client"

import { useMemo } from "react"
import { Layers, Shield, Target, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateEffectiveSectorExposure, isKnownETF } from "@/lib/etf-data"

interface Holding {
  id: string
  ticker: string
  allocation_percent: number | null
  sector: string | null
  holding_type?: string
}

interface Insight {
  category: "exposure" | "risk" | "concentration"
  title: string
  status: "good" | "warning" | "info"
  description: string
}

export function AIInsightsPanel({ holdings }: { holdings: Holding[] }) {
  const totalAllocation = holdings.reduce((sum, h) => sum + (h.allocation_percent || 0), 0)
  const etfCount = holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker)).length

  // Use effective sector exposure (looks through ETFs)
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
  const sectorCount = sortedSectors.length
  const maxSectorAllocation = sortedSectors[0]?.[1] || 0
  const dominantSector = sortedSectors[0]
  const maxHoldingAllocation = Math.max(...holdings.map((h) => h.allocation_percent || 0), 0)

  const insights: Insight[] = []

  // Exposure insights
  if (holdings.length === 0) {
    insights.push({
      category: "exposure",
      title: "No Holdings",
      status: "info",
      description: "Add stocks or ETFs to see exposure analysis",
    })
  } else if (sectorCount === 1) {
    insights.push({
      category: "exposure",
      title: "Single Sector",
      status: "warning",
      description: `100% effective exposure in ${dominantSector?.[0]}. Consider diversifying.`,
    })
  } else if (sectorCount >= 5) {
    insights.push({
      category: "exposure",
      title: "Well Diversified",
      status: "good",
      description: `Effective exposure across ${sectorCount} sectors${etfCount > 0 ? ` (including ${etfCount} ETF look-through)` : ""}`,
    })
  } else if (sectorCount >= 3) {
    insights.push({
      category: "exposure",
      title: "Multi-Sector",
      status: "good",
      description: `Spread across ${sectorCount} sectors${etfCount > 0 ? " via ETF look-through" : ""}`,
    })
  } else {
    insights.push({
      category: "exposure",
      title: "Limited Sectors",
      status: "info",
      description: `${sectorCount} sectors. Adding broad ETFs like SPY or VTI could help diversify.`,
    })
  }

  // ETF overlap detection
  if (etfCount >= 2) {
    const etfHoldings = holdings.filter((h) => h.holding_type === "etf" || isKnownETF(h.ticker))
    const etfTickers = etfHoldings.map((h) => h.ticker).join(", ")
    insights.push({
      category: "exposure",
      title: "ETF Overlap Check",
      status: "info",
      description: `You hold ${etfCount} ETFs (${etfTickers}). Check if they overlap in sector exposure.`,
    })
  }

  // Risk insights
  if (holdings.length > 0) {
    if (maxSectorAllocation > 50) {
      insights.push({
        category: "risk",
        title: "Sector Concentrated",
        status: "warning",
        description: `${dominantSector?.[0]} is ${maxSectorAllocation.toFixed(1)}% effective exposure`,
      })
    } else if (maxSectorAllocation <= 35 && sectorCount >= 3) {
      insights.push({
        category: "risk",
        title: "Balanced Risk",
        status: "good",
        description: "No single sector dominates your effective exposure",
      })
    } else {
      insights.push({
        category: "risk",
        title: "Moderate Risk",
        status: "info",
        description: `Top sector (${dominantSector?.[0]}) at ${maxSectorAllocation.toFixed(1)}%`,
      })
    }

    // Macro sensitivity based on effective exposure
    const techExposure = effectiveExposure["Technology"] || 0
    if (techExposure > 30) {
      insights.push({
        category: "risk",
        title: "Rate Sensitive",
        status: "info",
        description: `${techExposure.toFixed(1)}% tech exposure = sensitive to rate changes`,
      })
    }

    const energyExposure = effectiveExposure["Energy"] || 0
    if (energyExposure > 15) {
      insights.push({
        category: "risk",
        title: "Oil Price Exposure",
        status: "info",
        description: `${energyExposure.toFixed(1)}% energy exposure = sensitive to oil prices`,
      })
    }
  }

  // Concentration insights
  if (holdings.length > 0) {
    if (maxHoldingAllocation > 30) {
      const topHolding = holdings.find((h) => h.allocation_percent === maxHoldingAllocation)
      const topType = topHolding?.holding_type === "etf" || isKnownETF(topHolding?.ticker || "") ? "ETF" : "stock"
      insights.push({
        category: "concentration",
        title: "Top Heavy",
        status: "warning",
        description: `${topHolding?.ticker} (${topType}) is ${maxHoldingAllocation.toFixed(0)}% of portfolio`,
      })
    } else if (holdings.length >= 5 && maxHoldingAllocation <= 25) {
      insights.push({
        category: "concentration",
        title: "Well Spread",
        status: "good",
        description: `${holdings.length} holdings, none over 25%`,
      })
    } else if (holdings.length < 3) {
      insights.push({
        category: "concentration",
        title: "Few Holdings",
        status: "info",
        description: `Only ${holdings.length} position${holdings.length === 1 ? "" : "s"}. Consider adding more.`,
      })
    }
  }

  const getStatusIcon = (status: Insight["status"]) => {
    switch (status) {
      case "good":
        return <CheckCircle2 className="h-3.5 w-3.5 text-chart-3 flex-shrink-0" />
      case "warning":
        return <AlertCircle className="h-3.5 w-3.5 text-chart-4 flex-shrink-0" />
      case "info":
        return <Info className="h-3.5 w-3.5 text-chart-1 flex-shrink-0" />
    }
  }

  const getCategoryColor = (category: Insight["category"]) => {
    switch (category) {
      case "exposure":
        return "text-chart-1 bg-chart-1/10"
      case "risk":
        return "text-chart-5 bg-chart-5/10"
      case "concentration":
        return "text-chart-2 bg-chart-2/10"
    }
  }

  const groupedInsights = {
    exposure: insights.filter((i) => i.category === "exposure"),
    risk: insights.filter((i) => i.category === "risk"),
    concentration: insights.filter((i) => i.category === "concentration"),
  }

  const categories = [
    { key: "exposure" as const, label: "Exposure", icon: Layers },
    { key: "risk" as const, label: "Risk", icon: Shield },
    { key: "concentration" as const, label: "Concentration", icon: Target },
  ]

  return (
    <Card className="transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">AI Observations</CardTitle>
        <p className="text-xs text-muted-foreground">
          Real-time analysis with ETF look-through
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map(({ key, label, icon: Icon }) => {
          const categoryInsights = groupedInsights[key]
          if (categoryInsights.length === 0) return null

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${getCategoryColor(key)}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {label}
                </span>
              </div>
              <div className="space-y-2 pl-7">
                {categoryInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 rounded-md bg-muted/30 transition-all duration-200 hover:bg-muted/50 hover:translate-x-1"
                  >
                    {getStatusIcon(insight.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {totalAllocation > 0 && totalAllocation !== 100 && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground">
              Total allocation: {totalAllocation.toFixed(1)}%
              {totalAllocation < 100 && ` (${(100 - totalAllocation).toFixed(1)}% unallocated)`}
              {totalAllocation > 100 && " (over-allocated)"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
